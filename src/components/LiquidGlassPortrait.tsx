"use client";

import { useEffect, useId, useRef } from "react";
import {
  advanceHeroMomentum,
  heroReleaseVelocity,
  type HeroMomentum,
  type HeroMotionBounds,
  type HeroMotionSample,
} from "@/lib/hero-physics";
import "./liquid-glass-portrait.css";

type Props = {
  resetKey?: number;
  playful?: boolean;
  paused?: boolean;
  onInteraction?: () => void;
};
type MirrorPair = {
  source: Element;
  copy: HTMLElement | SVGElement;
  inline: Map<string, string>;
  before?: HTMLElement;
  after?: HTMLElement;
};

const MAGNIFICATION = 1.08;

const FAST_STYLES = new Set([
  "transform",
  "transform-origin",
  "translate",
  "rotate",
  "scale",
  "opacity",
  "z-index",
  "visibility",
  "filter",
  "cursor",
  "user-select",
  "-webkit-user-select",
  "touch-action",
]);

function inlineStyles(element: Element): Map<string, string> {
  const style = (element as HTMLElement | SVGElement).style;
  return new Map(
    Array.from(style || []).map((name) => [name, style.getPropertyValue(name)]),
  );
}

function snapshot(style: CSSStyleDeclaration): string {
  return Array.from(style)
    .map((name) => `${name}:${style.getPropertyValue(name)};`)
    .join("");
}

function inertStyle(element: HTMLElement | SVGElement, css: string) {
  element.style.cssText = css;
  element.style.setProperty("pointer-events", "none", "important");
  element.style.setProperty("animation", "none", "important");
  element.style.setProperty("transition", "none", "important");
  element.style.setProperty("caret-color", "transparent", "important");
}

/** A movable lens over an inert optical copy of the actual hero. */
export default function LiquidGlassPortrait({
  resetKey = 0,
  playful = false,
  paused = false,
  onInteraction,
}: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const instructionsId = `hero-glass-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const refreshRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const motionChangeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef({ paused, onInteraction });
  settingsRef.current = { paused, onInteraction };

  useEffect(() => {
    resetRef.current?.();
  }, [resetKey]);
  useEffect(() => {
    refreshRef.current?.();
  }, [playful]);
  useEffect(() => {
    motionChangeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const lens = lensRef.current;
    const mirror = mirrorRef.current;
    const handle = handleRef.current;
    const hero = surface?.closest<HTMLElement>(".ph-hero");
    const overlay = surface?.closest<HTMLElement>(".ph-glass-scene") || surface;
    if (!surface || !lens || !mirror || !handle || !hero || !overlay) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Computed styles cross this boundary explicitly. The shadow tree also keeps
    // generic source selectors, Draggable and source observers out of the copy.
    const shadow = mirror.shadowRoot || mirror.attachShadow({ mode: "open" });
    let pairs: MirrorPair[] = [];
    let nodes = new Map<Node, Node>();
    let pairBySource = new Map<Element, MirrorPair>();
    let rootCopy: HTMLElement | null = null;
    let frame = 0;
    let disposed = false;
    let visible = true;
    let rebuild = true;
    let fullSnapshot = true;
    let geometryDirty = true;
    let manuallyPlaced = false;
    let center: { x: number; y: number } | null = null;
    let bounds: HeroMotionBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    let measuredWidth = 0;
    let measuredHeight = 0;
    let momentum: HeroMomentum | null = null;
    let momentumTime = 0;
    let pointer: {
      id: number;
      offsetX: number;
      offsetY: number;
      clientX: number;
      clientY: number;
    } | null = null;
    let samples: HeroMotionSample[] = [];
    const dirtyStyles = new Set<Element>();
    const dirtyText = new Set<Node>();
    const dirtyValues = new Set<Element>();

    function constrain() {
      if (!center) return;
      center.x = Math.min(bounds.maxX, Math.max(bounds.minX, center.x));
      center.y = Math.min(bounds.maxY, Math.max(bounds.minY, center.y));
    }

    function canCoast() {
      return (
        !settingsRef.current.paused &&
        hero!.dataset.motionPaused !== "true" &&
        !reducedMotion.matches &&
        visible &&
        !document.hidden
      );
    }

    function stopMomentum() {
      momentum = null;
      momentumTime = 0;
    }

    function cancelPointer() {
      const id = pointer?.id;
      pointer = null;
      samples = [];
      surface!.dataset.dragging = "false";
      if (id !== undefined && handle!.hasPointerCapture(id))
        handle!.releasePointerCapture(id);
    }

    function excluded(node: Node): boolean {
      const element = node instanceof Element ? node : node.parentElement;
      return (
        !element ||
        overlay!.contains(element) ||
        Boolean(element.closest("[data-glass-mirror]"))
      );
    }

    function copyNode(source: Node): Node | null {
      if (
        source instanceof Element &&
        (excluded(source) ||
          source.matches("script, style, link, iframe, audio, video, canvas"))
      )
        return null;
      const copy = source.cloneNode(false);
      nodes.set(source, copy);
      if (
        source instanceof Element &&
        (copy instanceof HTMLElement || copy instanceof SVGElement)
      ) {
        for (const attribute of Array.from(copy.attributes)) {
          if (
            /^(?:id|class|name|for|form|tabindex|contenteditable|autofocus|role)$|^aria-|^data-|^on/i.test(
              attribute.name,
            )
          )
            copy.removeAttribute(attribute.name);
        }
        if (copy instanceof HTMLElement) {
          copy.inert = true;
          if (copy.matches("a, area")) copy.removeAttribute("href");
          if (copy.matches("form")) copy.removeAttribute("action");
        }
        const pair: MirrorPair = { source, copy, inline: inlineStyles(source) };
        pairs.push(pair);
        pairBySource.set(source, pair);
      }
      for (const child of Array.from(source.childNodes)) {
        const childCopy = copyNode(child);
        if (childCopy) copy.appendChild(childCopy);
      }
      return copy;
    }

    function syncValue(pair: MirrorPair) {
      const { source, copy } = pair;
      if (
        source instanceof HTMLInputElement &&
        copy instanceof HTMLInputElement
      ) {
        copy.value = source.value;
        copy.checked = source.checked;
      } else if (
        source instanceof HTMLTextAreaElement &&
        copy instanceof HTMLTextAreaElement
      )
        copy.value = source.value;
      else if (
        source instanceof HTMLSelectElement &&
        copy instanceof HTMLSelectElement
      )
        copy.selectedIndex = source.selectedIndex;
      else if (
        source instanceof HTMLImageElement &&
        copy instanceof HTMLImageElement &&
        source.currentSrc
      ) {
        copy.removeAttribute("srcset");
        copy.removeAttribute("sizes");
        if (copy.src !== source.currentSrc) copy.src = source.currentSrc;
      }
    }

    function syncPseudo(
      pair: MirrorPair,
      side: "before" | "after",
      css: string | undefined,
      content: string,
    ) {
      if (!css) {
        pair[side]?.remove();
        pair[side] = undefined;
        return;
      }
      let pseudo = pair[side];
      if (!pseudo) {
        pseudo = document.createElement("span");
        pseudo.inert = true;
        if (side === "before") pair.copy.prepend(pseudo);
        else pair.copy.append(pseudo);
        pair[side] = pseudo;
      }
      inertStyle(pseudo, css);
      try {
        pseudo.textContent = content.startsWith('"') ? JSON.parse(content) : "";
      } catch {
        pseudo.textContent = "";
      }
    }

    function readAllStyles() {
      // Batch reads before writes. This full pass is for initial layout/theme or
      // structure changes; per-frame GSAP mutations take the small path below.
      return pairs.map((pair) => {
        const before =
          pair.source instanceof HTMLElement
            ? getComputedStyle(pair.source, "::before")
            : null;
        const after =
          pair.source instanceof HTMLElement
            ? getComputedStyle(pair.source, "::after")
            : null;
        return {
          pair,
          css: snapshot(getComputedStyle(pair.source)),
          before:
            before &&
            before.content !== "none" &&
            before.content !== "normal" &&
            before.display !== "none"
              ? snapshot(before)
              : undefined,
          beforeText: before?.content || "",
          after:
            after &&
            after.content !== "none" &&
            after.content !== "normal" &&
            after.display !== "none"
              ? snapshot(after)
              : undefined,
          afterText: after?.content || "",
        };
      });
    }

    function positionLens() {
      if (!rootCopy) return;
      const rect = hero!.getBoundingClientRect();
      const surfaceRect = surface!.getBoundingClientRect();
      const backdrop =
        hero!.querySelector<HTMLElement>(
          "[data-glass-portrait-anchor] [data-glass-backdrop]",
        ) || hero!.querySelector<HTMLElement>("[data-glass-backdrop]");
      const circle = backdrop?.getBoundingClientRect();
      if (!circle || !rect.width || !rect.height || !circle.width) return;
      const radius = circle.width / 2;
      const home = {
        x: circle.left + circle.width / 2 - rect.left,
        y: circle.top + circle.height / 2 - rect.top,
      };
      // The mobile portrait slightly overhangs the hero's inner padding.
      // Include its actual home position so bounds do not offset the glass.
      bounds = {
        minX: Math.min(radius, home.x),
        maxX: Math.max(rect.width - radius, home.x),
        minY: Math.min(radius, home.y),
        maxY: Math.max(rect.height - radius, home.y),
      };
      if (!center || !manuallyPlaced) center = home;
      constrain();
      if (
        pointer &&
        (measuredWidth !== rect.width || measuredHeight !== rect.height)
      ) {
        pointer.offsetX = pointer.clientX - rect.left - center.x;
        pointer.offsetY = pointer.clientY - rect.top - center.y;
        samples = [];
      }
      measuredWidth = rect.width;
      measuredHeight = rect.height;
      const centerX = rect.left + center.x;
      const centerY = rect.top + center.y;
      const diameter = `${radius * 2}px`;
      lens!.style.width = diameter;
      lens!.style.height = diameter;
      lens!.style.transform = `translate3d(${centerX - surfaceRect.left - radius}px, ${centerY - surfaceRect.top - radius}px, 0)`;
      handle!.style.width = diameter;
      handle!.style.height = diameter;
      handle!.style.transform = lens!.style.transform;
      mirror!.style.width = `${rect.width}px`;
      mirror!.style.height = `${rect.height}px`;
      // Center the source point beneath the lens, then zoom about that point.
      // Set the origin inline so stylesheet order cannot shift the copy.
      const focusX = centerX - rect.left;
      const focusY = centerY - rect.top;
      mirror!.style.transformOrigin = `${focusX}px ${focusY}px`;
      mirror!.style.transform = `translate3d(${radius - focusX}px, ${radius - focusY}px, 0) scale(${MAGNIFICATION})`;
      Object.assign(rootCopy.style, {
        position: "absolute",
        inset: "auto",
        top: "0px",
        left: "0px",
        margin: "0px",
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        minWidth: "0px",
        maxWidth: "none",
        minHeight: "0px",
        maxHeight: "none",
        boxSizing: "border-box",
        transform: "none",
        translate: "none",
        rotate: "none",
        scale: "none",
      });
      surface!.dataset.ready = "true";
    }

    function render(time: number) {
      frame = 0;
      if (disposed || !visible || document.hidden) return;
      if (momentum) {
        if (!canCoast()) stopMomentum();
        else {
          const elapsed = Math.min(
            0.05,
            Math.max(0, (time - momentumTime) / 1000),
          );
          momentumTime = time;
          momentum = advanceHeroMomentum(momentum, bounds, elapsed);
          center = { x: momentum.x, y: momentum.y };
          geometryDirty = true;
          if (!momentum.vx && !momentum.vy) stopMomentum();
        }
      }
      if (rebuild) {
        pairs = [];
        nodes = new Map();
        pairBySource = new Map();
        rootCopy = copyNode(hero!) as HTMLElement;
        rootCopy.dataset.glassMirror = "";
        rootCopy.setAttribute("aria-hidden", "true");
        shadow.replaceChildren(rootCopy);
        rebuild = false;
        fullSnapshot = true;
      }
      if (!fullSnapshot) {
        // Transform/opacity updates never trigger another full-tree snapshot.
        const updates = Array.from(dirtyStyles).flatMap((source) => {
          const pair = pairBySource.get(source);
          if (!pair) return [];
          const current = inlineStyles(source);
          const changed = [
            ...new Set([...pair.inline.keys(), ...current.keys()]),
          ].filter((name) => pair.inline.get(name) !== current.get(name));
          pair.inline = current;
          if (changed.some((name) => !FAST_STYLES.has(name))) {
            fullSnapshot = true;
            return [];
          }
          const style = getComputedStyle(source);
          return changed.map((name) => ({
            copy: pair.copy,
            name,
            value: style.getPropertyValue(name),
          }));
        });
        if (!fullSnapshot)
          updates.forEach(({ copy, name, value }) =>
            copy.style.setProperty(name, value),
          );
      }
      if (fullSnapshot) {
        readAllStyles().forEach(
          ({ pair, css, before, beforeText, after, afterText }) => {
            inertStyle(pair.copy, css);
            pair.inline = inlineStyles(pair.source);
            syncPseudo(pair, "before", before, beforeText);
            syncPseudo(pair, "after", after, afterText);
            syncValue(pair);
          },
        );
        fullSnapshot = false;
        geometryDirty = true;
      }
      dirtyText.forEach((source) => {
        const copy = nodes.get(source);
        if (copy) copy.textContent = source.textContent;
      });
      dirtyValues.forEach((source) => {
        const pair = pairBySource.get(source);
        if (pair) syncValue(pair);
      });
      if (geometryDirty) {
        positionLens();
        geometryDirty = false;
      }
      dirtyStyles.clear();
      dirtyText.clear();
      dirtyValues.clear();
      if (momentum) requestRender();
    }

    function requestRender() {
      if (!frame && !disposed && visible && !document.hidden)
        frame = requestAnimationFrame(render);
    }
    function layoutChange() {
      geometryDirty = true;
      requestRender();
    }
    function refresh() {
      fullSnapshot = true;
      geometryDirty = true;
      requestRender();
    }
    function reset() {
      stopMomentum();
      cancelPointer();
      manuallyPlaced = false;
      center = null;
      layoutChange();
    }
    function pointerDown(event: PointerEvent) {
      if (!event.isPrimary || event.button !== 0 || pointer) return;
      event.preventDefault();
      stopMomentum();
      positionLens();
      if (!center) return;
      const rect = hero!.getBoundingClientRect();
      pointer = {
        id: event.pointerId,
        offsetX: event.clientX - rect.left - center.x,
        offsetY: event.clientY - rect.top - center.y,
        clientX: event.clientX,
        clientY: event.clientY,
      };
      samples = [{ ...center, time: performance.now() }];
      surface!.dataset.input = "pointer";
      handle!.focus({ preventScroll: true });
      handle!.setPointerCapture(event.pointerId);
      surface!.dataset.dragging = "true";
      settingsRef.current.onInteraction?.();
    }
    function pointerMove(event: PointerEvent) {
      if (pointer?.id !== event.pointerId || !center) return;
      event.preventDefault();
      const rect = hero!.getBoundingClientRect();
      if (
        event.clientX !== pointer.clientX ||
        event.clientY !== pointer.clientY
      )
        manuallyPlaced = true;
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;
      center.x = event.clientX - rect.left - pointer.offsetX;
      center.y = event.clientY - rect.top - pointer.offsetY;
      constrain();
      const now = performance.now();
      samples = [
        ...samples.filter((sample) => now - sample.time <= 110),
        { ...center, time: now },
      ].slice(-16);
      layoutChange();
    }
    function pointerEnd(event: PointerEvent) {
      if (pointer?.id !== event.pointerId || !center) return;
      const now = performance.now();
      const velocity =
        event.type === "pointerup" && canCoast()
          ? heroReleaseVelocity(samples, now)
          : { vx: 0, vy: 0 };
      cancelPointer();
      if (velocity.vx || velocity.vy) {
        momentum = { ...center, ...velocity };
        momentumTime = now;
      }
      layoutChange();
    }
    function clearInputMode() {
      delete surface!.dataset.input;
    }
    function keyDown(event: KeyboardEvent) {
      surface!.dataset.input = "keyboard";
      if (event.key === "Home" || event.key === "Escape") {
        event.preventDefault();
        reset();
        settingsRef.current.onInteraction?.();
        return;
      }
      if (
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      stopMomentum();
      cancelPointer();
      positionLens();
      if (!center) return;
      manuallyPlaced = true;
      const step = event.shiftKey ? 40 : 16;
      center.x +=
        event.key === "ArrowLeft"
          ? -step
          : event.key === "ArrowRight"
            ? step
            : 0;
      center.y +=
        event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
      constrain();
      layoutChange();
      settingsRef.current.onInteraction?.();
    }
    function motionChange() {
      if (!canCoast()) stopMomentum();
    }
    function blurWindow() {
      stopMomentum();
      cancelPointer();
    }
    function valueChange(event: Event) {
      if (event.target instanceof Element && !excluded(event.target)) {
        dirtyValues.add(event.target);
        requestRender();
      }
    }
    function focusChange(event: Event) {
      if (event.target instanceof Element && !excluded(event.target)) refresh();
    }
    function visibilityChange() {
      cancelAnimationFrame(frame);
      frame = 0;
      if (document.hidden) blurWindow();
      if (!document.hidden && visible) refresh();
    }

    const mutations = new MutationObserver((records) => {
      let changed = false;
      for (const mutation of records) {
        if (excluded(mutation.target)) continue;
        if (
          mutation.type === "attributes" &&
          mutation.target instanceof Element &&
          mutation.attributeName &&
          mutation.target.getAttribute(mutation.attributeName) ===
            mutation.oldValue
        )
          continue;
        changed = true;
        if (mutation.type === "childList") rebuild = true;
        else if (mutation.type === "characterData")
          dirtyText.add(mutation.target);
        else if (
          mutation.attributeName === "style" &&
          mutation.target instanceof Element
        )
          dirtyStyles.add(mutation.target);
        else fullSnapshot = true;
      }
      if (changed) requestRender();
    });
    mutations.observe(hero, {
      attributes: true,
      attributeOldValue: true,
      childList: true,
      characterData: true,
      subtree: true,
    });
    const resize = new ResizeObserver(refresh);
    resize.observe(hero);
    const backdrop = hero.querySelector("[data-glass-backdrop]");
    if (backdrop) resize.observe(backdrop);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) refresh();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
          blurWindow();
        }
      },
      { rootMargin: "40px" },
    );
    intersection.observe(hero);
    hero.addEventListener("hero-layout-change", layoutChange);
    hero.addEventListener("hero-layout-reset", reset);
    hero.addEventListener("hero-motion-change", motionChange);
    handle.addEventListener("pointerdown", pointerDown);
    handle.addEventListener("pointermove", pointerMove);
    handle.addEventListener("pointerup", pointerEnd);
    handle.addEventListener("pointercancel", pointerEnd);
    handle.addEventListener("lostpointercapture", pointerEnd);
    handle.addEventListener("keydown", keyDown);
    handle.addEventListener("blur", clearInputMode);
    window.addEventListener("blur", blurWindow);
    reducedMotion.addEventListener("change", motionChange);
    hero.addEventListener("input", valueChange, true);
    hero.addEventListener("change", valueChange, true);
    hero.addEventListener("focusin", focusChange);
    hero.addEventListener("focusout", focusChange);
    hero.addEventListener("load", refresh, true);
    document.addEventListener("visibilitychange", visibilityChange);
    document.fonts.ready.then(() => {
      if (!disposed) refresh();
    });
    refreshRef.current = refresh;
    resetRef.current = reset;
    motionChangeRef.current = motionChange;
    // Defer until ancestor GSAP setup has finished, before taking the first copy.
    requestRender();

    return () => {
      disposed = true;
      refreshRef.current = null;
      resetRef.current = null;
      motionChangeRef.current = null;
      cancelAnimationFrame(frame);
      blurWindow();
      mutations.disconnect();
      resize.disconnect();
      intersection.disconnect();
      hero.removeEventListener("hero-layout-change", layoutChange);
      hero.removeEventListener("hero-layout-reset", reset);
      hero.removeEventListener("hero-motion-change", motionChange);
      handle.removeEventListener("pointerdown", pointerDown);
      handle.removeEventListener("pointermove", pointerMove);
      handle.removeEventListener("pointerup", pointerEnd);
      handle.removeEventListener("pointercancel", pointerEnd);
      handle.removeEventListener("lostpointercapture", pointerEnd);
      handle.removeEventListener("keydown", keyDown);
      handle.removeEventListener("blur", clearInputMode);
      window.removeEventListener("blur", blurWindow);
      reducedMotion.removeEventListener("change", motionChange);
      hero.removeEventListener("input", valueChange, true);
      hero.removeEventListener("change", valueChange, true);
      hero.removeEventListener("focusin", focusChange);
      hero.removeEventListener("focusout", focusChange);
      hero.removeEventListener("load", refresh, true);
      document.removeEventListener("visibilitychange", visibilityChange);
      shadow.replaceChildren();
      pairs = [];
      nodes.clear();
      pairBySource.clear();
    };
  }, []);

  return (
    <div
      ref={surfaceRef}
      className="lgp-portrait"
      data-playful={playful}
      data-paused={paused}
    >
      <div ref={lensRef} className="lgp-lens" aria-hidden="true" inert>
        <div className="lgp-lens-view">
          <div
            ref={mirrorRef}
            className="lgp-mirror-plane"
            data-glass-mirror=""
            aria-hidden="true"
            inert
          />
        </div>
        <div className="lgp-optical-rim" />
        <div className="lgp-reflection" />
      </div>
      <button
        ref={handleRef}
        className="lgp-lens-handle"
        type="button"
        aria-label="Move the magnifying glass"
        aria-describedby={instructionsId}
      />
      <span className="lgp-instructions sr-only" id={instructionsId}>
        Drag the glass to magnify the page. Use arrow keys to move it, Shift for
        larger steps, and Home to reset it over the portrait circle.
      </span>
    </div>
  );
}

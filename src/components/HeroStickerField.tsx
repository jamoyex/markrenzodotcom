"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import Image from "next/image";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import "./hero-sticker-field.css";

type Props = {
  paused: boolean;
  resetKey: number;
  onCelebrate: () => void;
  onMoveSticker: (event: KeyboardEvent<HTMLElement>) => void;
};

const stickers = [
  { id: "mr", label: "MR", rotation: -14 },
  { id: "play", label: "PLAY", rotation: 12 },
  { id: "postcard", label: "Travel postcard", rotation: -9 },
  { id: "whatif", label: "What if?", rotation: -7 },
] as const;

function StickerArt({ id }: { id: (typeof stickers)[number]["id"] }) {
  if (id === "mr" || id === "play") {
    return (
      <Image
        src={`/images/brand/${id === "mr" ? "pixel-mr" : "play-sticker"}.png`}
        width={id === "mr" ? 1254 : 1774}
        height={id === "mr" ? 1254 : 887}
        sizes={
          id === "mr"
            ? "(max-width: 800px) 52px, 110px"
            : "(max-width: 800px) 78px, 158px"
        }
        alt=""
        draggable={false}
      />
    );
  }
  if (id === "postcard") {
    return (
      <span className="hsf-postcard-art">
        <Image
          src="/images/great-ocean-road.png"
          width={706}
          height={1264}
          sizes="(max-width: 800px) 50px, 86px"
          alt=""
          draggable={false}
        />
        <span>A LITTLE DETOUR ↗</span>
      </span>
    );
  }
  return (
    <span className="hsf-word-art">
      <span>what</span>
      <strong>if?</strong>
    </span>
  );
}

export default function HeroStickerField({
  paused,
  resetKey,
  onCelebrate,
  onMoveSticker,
}: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const controlsRef = useRef<{ sync: () => void; reset: () => void } | null>(
    null,
  );

  useEffect(() => {
    pausedRef.current = paused;
    controlsRef.current?.sync();
  }, [paused]);

  useEffect(() => {
    controlsRef.current?.reset();
  }, [resetKey]);

  useEffect(() => {
    const field = fieldRef.current;
    const hero = field?.closest<HTMLElement>(".ph-hero");
    if (!field || !hero) return;
    gsap.registerPlugin(MotionPathPlugin);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let visible = true;
    let resizeFrame = 0;
    let disposed = false;
    const entries = Array.from(
      hero.querySelectorAll<HTMLElement>(".hsf-anchor, .ph-project-flight"),
    ).map((anchor) => ({
      anchor,
      motion: anchor.querySelector<HTMLElement>(
        ".hsf-motion, .ph-project-motion",
      )!,
      button: anchor.querySelector<HTMLButtonElement>("button")!,
      tween: null as gsap.core.Tween | null,
      hovered: false,
      focused: false,
      manual: false,
      origin: { x: 0, y: 0 },
      pointer: null as { id: number; x: number; y: number } | null,
    }));

    function sync() {
      const stopped =
        pausedRef.current ||
        reduced.matches ||
        !visible ||
        document.hidden ||
        ["loading", "running"].includes(hero!.dataset.intro || "");
      entries.forEach((entry) => {
        entry.tween?.paused(
          stopped ||
            entry.hovered ||
            entry.focused ||
            entry.manual ||
            !!entry.pointer,
        );
      });
      field!.dataset.motion = stopped ? "paused" : "playing";
    }

    function buildPaths(only?: (typeof entries)[number]) {
      if (
        disposed ||
        ["loading", "running"].includes(hero!.dataset.intro || "")
      )
        return;
      const compact = field!.clientWidth <= 840;
      const narrow = window.matchMedia(
        "(max-width: 520px), (max-width: 800px) and (max-height: 850px)",
      ).matches;
      entries.forEach((entry, index) => {
        if (entry.manual || (only && only !== entry)) return;
        const progress = entry.tween?.progress() ?? 0;
        entry.tween?.kill();
        // Keep the drag parent's axes aligned with the hero. Static artwork
        // tilt belongs to the button; the ambient wrapper only translates.
        gsap.set(entry.button, { rotation: stickers[index]?.rotation ?? -7 });
        gsap.set(entry.motion, { ...entry.origin, rotation: 0 });
        const area = hero!.getBoundingClientRect();
        const piece = entry.button.getBoundingClientRect();
        // Drift toward the roomy side of the hero, never farther off its edge.
        const left = Math.max(0, piece.left - area.left - 6);
        const right = Math.max(0, area.right - piece.right - 6);
        const direction =
          entry.anchor.matches(".hsf-postcard") || right >= left ? 1 : -1;
        const horizontal =
          direction *
          Math.min(
            narrow ? 24 : compact ? 42 : 72 + index * 6,
            direction > 0 ? right : left,
          );
        const titleBottom =
          hero!.querySelector(".ph-title")?.getBoundingClientRect().bottom ??
          area.top;
        const ceiling = entry.anchor.matches(".ph-project-flight")
          ? Math.max(area.top, titleBottom + 8)
          : area.top;
        const vertical = Math.max(
          0,
          Math.min(
            narrow ? 14 : compact ? 25 : 36 + index * 3,
            piece.top - ceiling - 4,
            area.bottom - piece.bottom - 4,
          ),
        );
        const { x, y } = entry.origin;
        const rx = horizontal / 2;
        const cx = x + rx;
        const k = 0.5522847498;
        // A closed ellipse has matching tangents at the seam. Linear path
        // progress keeps the stickers moving instead of stopping at waypoints.
        const path = `M ${x},${y}
          C ${x},${y - vertical * k} ${cx - rx * k},${y - vertical} ${cx},${y - vertical}
          C ${cx + rx * k},${y - vertical} ${x + horizontal},${y - vertical * k} ${x + horizontal},${y}
          C ${x + horizontal},${y + vertical * k} ${cx + rx * k},${y + vertical} ${cx},${y + vertical}
          C ${cx - rx * k},${y + vertical} ${x},${y + vertical * k} ${x},${y} Z`;
        entry.tween = gsap.to(entry.motion, {
          motionPath: { path, autoRotate: false },
          duration: 16 + index * 1.75,
          ease: "none",
          repeat: -1,
          paused: true,
        });
        entry.tween.progress(reduced.matches || only ? 0 : progress);
      });
      sync();
    }

    function markPlaced(entry: (typeof entries)[number]) {
      entry.manual = true;
      entry.button.dataset.manuallyPlaced = "true";
      sync();
    }
    function reset() {
      entries.forEach((entry) => {
        entry.manual = false;
        entry.pointer = null;
        entry.origin = { x: 0, y: 0 };
        delete entry.button.dataset.manuallyPlaced;
        entry.tween?.kill();
        entry.tween = null;
      });
      buildPaths();
    }
    const cleanupEvents = entries.map((entry) => {
      const enter = () => {
        entry.hovered = finePointer.matches;
        sync();
      };
      const leave = () => {
        entry.hovered = false;
        sync();
      };
      const focus = () => {
        entry.focused = entry.button.matches(":focus-visible");
        sync();
      };
      const blur = () => {
        entry.focused = false;
        sync();
      };
      const press = (event: PointerEvent) => {
        if (!event.isPrimary) return;
        entry.pointer = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
        sync();
      };
      const key = (event: globalThis.KeyboardEvent) => {
        if (
          ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
            event.key,
          )
        ) {
          entry.focused = true;
          markPlaced(entry);
        }
      };
      const start = () => markPlaced(entry);
      const settle = () => {
        entry.origin = {
          x: Number(gsap.getProperty(entry.motion, "x")),
          y: Number(gsap.getProperty(entry.motion, "y")),
        };
        entry.manual = false;
        entry.tween?.kill();
        entry.tween = null;
        buildPaths(entry);
      };
      entry.button.addEventListener("pointerenter", enter);
      entry.button.addEventListener("pointerleave", leave);
      entry.button.addEventListener("focus", focus);
      entry.button.addEventListener("blur", blur);
      entry.button.addEventListener("pointerdown", press);
      entry.button.addEventListener("keydown", key);
      entry.button.addEventListener("hero-drag-start", start);
      entry.button.addEventListener("hero-drag-settle", settle);
      return () => {
        entry.button.removeEventListener("pointerenter", enter);
        entry.button.removeEventListener("pointerleave", leave);
        entry.button.removeEventListener("focus", focus);
        entry.button.removeEventListener("blur", blur);
        entry.button.removeEventListener("pointerdown", press);
        entry.button.removeEventListener("keydown", key);
        entry.button.removeEventListener("hero-drag-start", start);
        entry.button.removeEventListener("hero-drag-settle", settle);
      };
    });
    const move = (event: PointerEvent) => {
      entries.forEach((entry) => {
        if (
          entry.pointer?.id === event.pointerId &&
          Math.hypot(
            event.clientX - entry.pointer.x,
            event.clientY - entry.pointer.y,
          ) > 4
        )
          markPlaced(entry);
      });
    };
    const release = () => {
      entries.forEach((entry) => {
        entry.pointer = null;
      });
      sync();
    };
    const visibility = () => {
      if (document.hidden)
        entries.forEach((entry) => {
          entry.pointer = null;
          entry.hovered = false;
        });
      sync();
    };
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => buildPaths());
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    resizeObserver.observe(hero);
    intersectionObserver.observe(hero);
    hero.addEventListener("hero-layout-reset", reset);
    const introComplete = () => buildPaths();
    hero.addEventListener("hero-intro-complete", introComplete);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    const mediaChange = () => buildPaths();
    reduced.addEventListener("change", mediaChange);
    controlsRef.current = { sync, reset };
    buildPaths();
    return () => {
      disposed = true;
      controlsRef.current = null;
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      cleanupEvents.forEach((cleanup) => cleanup());
      entries.forEach((entry) => entry.tween?.kill());
      hero.removeEventListener("hero-layout-reset", reset);
      hero.removeEventListener("hero-intro-complete", introComplete);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      reduced.removeEventListener("change", mediaChange);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="hsf-field"
      role="group"
      aria-label="Movable stickers"
    >
      {stickers.map((sticker) => (
        <div key={sticker.id} className={`hsf-anchor hsf-${sticker.id}`}>
          <div className="hsf-motion">
            <button
              type="button"
              className="draggable-sticker hsf-sticker"
              style={{ transform: `rotate(${sticker.rotation}deg)` }}
              aria-label={`${sticker.label} sticker: drag or use arrow keys to move${sticker.id === "play" ? ", press to celebrate" : ""}`}
              onKeyDown={onMoveSticker}
              onClick={sticker.id === "play" ? onCelebrate : undefined}
            >
              <StickerArt id={sticker.id} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

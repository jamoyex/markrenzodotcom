"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowCounterClockwise,
  Smiley,
  ArrowUpRight,
  Pause,
  Play,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import {
  advanceHeroMomentum,
  heroReleaseVelocity,
  type HeroMomentum,
  type HeroMotionSample,
  type HeroMotionBounds,
} from "@/lib/hero-physics";
import "./life-collage.css";

import { lifeMedia } from "@/data/life-media";
import LifeLightbox from "./LifeLightbox";

export default function LifeCollage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<{ reset: () => void; sync: () => void } | null>(
    null,
  );
  const [paused, setPaused] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const pausedRef = useRef(false);
  const helpId = useId();

  useEffect(() => {
    pausedRef.current = paused || lightboxIndex !== null;
    controlsRef.current?.sync();
  }, [paused, lightboxIndex]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    gsap.registerPlugin(Draggable);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const targets = Array.from(
      board.querySelectorAll<HTMLElement>(".lc-piece"),
    );
    const listeners: Array<() => void> = [];
    type Entry = {
      target: HTMLElement;
      drag: Draggable | null;
      motion: HeroMomentum;
      bounds: HeroMotionBounds;
      hovering: boolean;
      focused: boolean;
      held: boolean;
      speed: number;
      heading: number;
    };
    const entries: Entry[] = [];
    let frame = 0;
    let previous = 0;
    let visible = false;
    let entered = false;
    let entering = false;
    let topLayer = 10;
    let intro: gsap.core.Timeline | null = null;
    let resetting: gsap.core.Tween | null = null;
    let disposed = false;

    const bounds = (target: HTMLElement): HeroMotionBounds => {
      const area = board.getBoundingClientRect();
      const rect = (
        target.querySelector(".lc-face") ?? target
      ).getBoundingClientRect();
      const x = Number(gsap.getProperty(target, "x"));
      const y = Number(gsap.getProperty(target, "y"));
      const minX = x + area.left + 6 - rect.left;
      const minY = y + area.top + 6 - rect.top;
      return {
        minX,
        maxX: Math.max(minX, x + area.right - 6 - rect.right),
        minY,
        maxY: Math.max(minY, y + area.bottom - 6 - rect.bottom),
      };
    };
    const stopped = () =>
      disposed ||
      !entered ||
      entering ||
      !!resetting ||
      pausedRef.current ||
      reduced.matches ||
      !visible ||
      document.hidden;
    const stopFrame = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    };
    const cruise = (entry: Entry) => {
      const speed = Math.hypot(entry.motion.vx, entry.motion.vy);
      if (speed >= entry.speed) return;
      const heading =
        speed > 0
          ? Math.atan2(entry.motion.vy, entry.motion.vx)
          : entry.heading;
      entry.motion.vx = Math.cos(heading) * entry.speed;
      entry.motion.vy = Math.sin(heading) * entry.speed;
    };
    const tick = (time: number) => {
      frame = 0;
      if (stopped()) return;
      const delta = previous
        ? Math.min((time - previous) / 1000, 0.05)
        : 1 / 60;
      previous = time;
      entries.forEach((entry) => {
        if (entry.hovering || entry.focused || entry.held) return;
        // Use the hero's damping and rebounds, then retain a slow cruise instead
        // of coming to rest. A throw blends into drift at its current position.
        cruise(entry);
        entry.motion = advanceHeroMomentum(entry.motion, entry.bounds, delta);
        cruise(entry);
        gsap.set(entry.target, { x: entry.motion.x, y: entry.motion.y });
        entry.drag?.update();
      });
      frame = requestAnimationFrame(tick);
    };
    function sync() {
      board!.dataset.motion = stopped() ? "paused" : "playing";
      if (stopped()) stopFrame();
      else if (!frame) frame = requestAnimationFrame(tick);
    }
    const measure = () => {
      entries.forEach((entry) => {
        entry.bounds = bounds(entry.target);
        entry.drag?.applyBounds(entry.bounds);
        entry.drag?.update();
        entry.motion.x = Number(gsap.getProperty(entry.target, "x"));
        entry.motion.y = Number(gsap.getProperty(entry.target, "y"));
      });
    };
    const finishEntrance = () => {
      if (!entering && entered) return;
      intro?.kill();
      intro = null;
      entering = false;
      entered = true;
      gsap.set(targets, { x: 0, y: 0, scale: 1, opacity: 1 });
      board.dataset.entrance = "complete";
      measure();
      sync();
    };
    targets.forEach((target, index) => {
      gsap.set(target, { rotation: 0, x: 0, y: 0, scale: 1 });
      const heading = [0.4, 2.7, -0.55, -2.6, 2.35, -0.25, 2.8, 0.7][index];
      const entry: Entry = {
        target,
        drag: null,
        motion: { x: 0, y: 0, vx: 0, vy: 0 },
        bounds: bounds(target),
        hovering: false,
        focused: false,
        held: false,
        speed: board.clientWidth < 700 ? 12 : 16 + (index % 3) * 2,
        heading,
      };
      entries.push(entry);
      let samples: HeroMotionSample[] = [];
      let dragged = false;
      let suppressClickUntil = 0;
      const record = (x: number, y: number) => {
        const time = performance.now();
        samples = [
          ...samples.filter((sample) => time - sample.time < 140),
          { x, y, time },
        ];
      };
      const [drag] = Draggable.create(target, {
        type: "x,y",
        bounds: entry.bounds,
        minimumMovement: 5,
        edgeResistance: 1,
        dragClickables: true,
        suppressClickOnDrag: true,
        zIndexBoost: false,
        onPressInit() {
          if (!entered || entering) finishEntrance();
          if (resetting) {
            resetting.kill();
            resetting = null;
            measure();
          }
          entry.held = true;
          gsap.set(target, { zIndex: ++topLayer });
          this.applyBounds(bounds(target));
          this.update();
          entry.bounds = bounds(target);
          samples = [];
          dragged = false;
          record(this.x, this.y);
        },
        onDragStart() {
          dragged = true;
          entry.hovering = false;
          target.dataset.dragging = "true";
        },
        onDrag() {
          record(this.x, this.y);
        },
        onRelease() {
          delete target.dataset.dragging;
          entry.held = false;
          entry.motion.x = this.x;
          entry.motion.y = this.y;
          if (dragged) {
            suppressClickUntil = performance.now() + 500;
            const velocity = heroReleaseVelocity(samples, performance.now());
            entry.motion.vx = velocity.vx;
            entry.motion.vy = velocity.vy;
            entry.focused = false;
          }
          samples = [];
          sync();
        },
      });
      entry.drag = drag;
      const preventDragClick = (event: MouseEvent) => {
        if (event.detail > 0 && performance.now() < suppressClickUntil) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      };
      const key = (event: KeyboardEvent) => {
        if (
          !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
            event.key,
          )
        )
          return;
        event.preventDefault();
        finishEntrance();
        if (resetting) {
          resetting.kill();
          resetting = null;
          measure();
        }
        entry.focused = true;
        const step = event.shiftKey ? 40 : 12;
        const x =
          event.key === "Home"
            ? 0
            : drag.x +
              (event.key === "ArrowRight"
                ? step
                : event.key === "ArrowLeft"
                  ? -step
                  : 0);
        const y =
          event.key === "Home"
            ? 0
            : drag.y +
              (event.key === "ArrowDown"
                ? step
                : event.key === "ArrowUp"
                  ? -step
                  : 0);
        gsap.set(target, { x, y, zIndex: ++topLayer });
        drag.update();
        drag.applyBounds(bounds(target));
        entry.motion = { ...entry.motion, x: drag.x, y: drag.y };
      };
      const enter = () => {
        if (fine.matches) entry.hovering = true;
      };
      const leave = () => {
        entry.hovering = false;
        sync();
      };
      const focus = () => {
        entry.focused = target.matches(":focus-visible");
        if (!entered || entering) finishEntrance();
      };
      const blur = () => {
        entry.focused = false;
        sync();
      };
      target.addEventListener("click", preventDragClick, true);
      target.addEventListener("keydown", key);
      target.addEventListener("pointerenter", enter);
      target.addEventListener("pointerleave", leave);
      target.addEventListener("focus", focus);
      target.addEventListener("blur", blur);
      listeners.push(() => {
        target.removeEventListener("click", preventDragClick, true);
        target.removeEventListener("keydown", key);
        target.removeEventListener("pointerenter", enter);
        target.removeEventListener("pointerleave", leave);
        target.removeEventListener("focus", focus);
        target.removeEventListener("blur", blur);
      });
    });
    const entrance = () => {
      if (entered || entering) return;
      if (reduced.matches || pausedRef.current) {
        finishEntrance();
        return;
      }
      entering = true;
      board.dataset.entrance = "running";
      const area = board.getBoundingClientRect();
      const origin = {
        x: area.left + area.width * 0.32,
        y: area.top + Math.min(area.height * 0.36, 320),
      };
      intro = gsap.timeline({ onComplete: finishEntrance });
      targets.forEach((target, index) => {
        const rect = target.getBoundingClientRect();
        intro!.fromTo(
          target,
          {
            x: origin.x - rect.left - rect.width / 2,
            y: origin.y - rect.top - rect.height / 2,
            scale: 0.92,
            opacity: 0,
          },
          {
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 1.1,
            ease: "power3.out",
          },
          index * 0.07,
        );
      });
    };
    const reset = () => {
      finishEntrance();
      stopFrame();
      resetting?.kill();
      entries.forEach((entry, index) => {
        entry.motion.vx = 0;
        entry.motion.vy = 0;
        gsap.set(entry.target, { zIndex: index + 1 });
      });
      topLayer = 10;
      if (reduced.matches) {
        gsap.set(targets, { x: 0, y: 0 });
        measure();
        sync();
        return;
      }
      resetting = gsap.to(targets, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "power3.out",
        onComplete: () => {
          resetting = null;
          measure();
          sync();
        },
      });
    };
    controlsRef.current = { reset, sync };
    if (!reduced.matches) gsap.set(targets, { opacity: 0 });
    else finishEntrance();
    let boardWidth = board.clientWidth;
    let boardHeight = board.clientHeight;
    const resize = new ResizeObserver(() => {
      if (
        board.clientWidth === boardWidth &&
        board.clientHeight === boardHeight
      )
        return;
      boardWidth = board.clientWidth;
      boardHeight = board.clientHeight;
      if (entering) finishEntrance();
      resetting?.kill();
      resetting = null;
      measure();
      sync();
    });
    resize.observe(board);
    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && entry.intersectionRatio > 0.08) entrance();
        // Complete the brief entrance if the visitor scrolls past it.
        if (!visible && entering) finishEntrance();
        sync();
      },
      { threshold: [0, 0.08] },
    );
    intersection.observe(board);
    const reduceChange = () => {
      if (reduced.matches) finishEntrance();
      sync();
    };
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", reduceChange);
    return () => {
      disposed = true;
      stopFrame();
      intro?.kill();
      resetting?.kill();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", reduceChange);
      listeners.forEach((remove) => remove());
      entries.forEach((entry) => entry.drag?.kill());
      gsap.set(targets, { clearProps: "transform,opacity,zIndex" });
      controlsRef.current = null;
    };
  }, []);

  return (
    <>
      <div className="lc-wrap">
        <p id={helpId} className="sr-only">
          Click a photo to open it, or drag to rearrange. With a photo or
          sticker focused, use arrow keys to move it, Shift for larger steps, or
          Home to return it.
        </p>
        <div
          ref={boardRef}
          className="lc-board"
          role="group"
          aria-label="Five moments from life outside work"
        >
          {lifeMedia.map((photo, index) => (
            <button
              type="button"
              className={`lc-piece lc-photo lc-photo-${index + 1}`}
              key={photo.src}
              aria-label={`Open ${photo.type === "video" ? "video" : "photo"}: ${photo.caption}`}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                setLightboxIndex(index);
              }}
              aria-describedby={helpId}
            >
              <span className="lc-face">
                {photo.type === "video" && !photo.poster ? (
                  <video
                    src={photo.src}
                    aria-label={photo.alt}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={photo.type === "video" ? photo.poster! : photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(max-width: 600px) 160px, 280px"
                    loading="lazy"
                    draggable={false}
                  />
                )}
                {photo.type === "video" && (
                  <span className="lc-video-badge">
                    <Play size={18} weight="fill" /> Video
                  </span>
                )}
                <span className="lc-caption">{photo.caption}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            className="lc-piece lc-human"
            aria-label="Move Still a human sticker"
            aria-describedby={helpId}
          >
            <span className="lc-face">
              <Smiley weight="bold" />
              <span>
                STILL A<br />
                HUMAN.
              </span>
            </span>
          </button>
          <button
            type="button"
            className="lc-piece lc-detour"
            aria-label="Move Take the detour sticker"
            aria-describedby={helpId}
          >
            <span className="lc-face">
              <span>
                take the
                <br />
                detour
              </span>
              <ArrowUpRight weight="bold" />
            </span>
          </button>
          <button
            type="button"
            className="lc-piece lc-note"
            aria-label="Move real life note"
            aria-describedby={helpId}
          >
            <span className="lc-face">
              a few tabs
              <br />
              from real life.
            </span>
          </button>
        </div>
        <div className="lc-controls">
          <span>Drag a memory. Tap to take a closer look.</span>
          <div className="lc-control-actions">
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play size={17} /> : <Pause size={17} />}{" "}
              {paused ? "Resume motion" : "Pause motion"}
            </button>
            <button type="button" onClick={() => controlsRef.current?.reset()}>
              <ArrowCounterClockwise size={17} /> Reset photos
            </button>
          </div>
        </div>
      </div>
      <LifeLightbox
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
}

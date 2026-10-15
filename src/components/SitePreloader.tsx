"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";
import "./site-preloader.css";

const SESSION_KEY = "mark-renzo:welcome:v1";
const MAX_WAIT_MS = 4500;

export default function SitePreloader({
  content,
  onReady,
}: {
  content: RefObject<HTMLElement | null>;
  onReady: (playIntro: boolean) => void;
}) {
  const overlay = useRef<HTMLElement>(null);
  const skip = useRef<() => void>(() => {});
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const surface = overlay.current;
    const page = content.current;
    if (!surface || !page) return;
    let visited = false;
    try {
      visited = sessionStorage.getItem(SESSION_KEY) === "seen";
    } catch {
      /* Storage is optional. */
    }
    if (
      visited ||
      window.scrollY > 80 ||
      (location.hash && location.hash !== "#home")
    ) {
      onReady(false);
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const started = performance.now();
    const oldOverflow = document.body.style.overflow;
    const oldInert = page.inert;
    const oldBusy = page.getAttribute("aria-busy");
    document.body.style.overflow = "hidden";
    page.inert = true;
    page.setAttribute("aria-busy", "true");

    let disposed = false;
    let finishing = false;
    let minimumTimer = 0;
    let deadline = 0;
    let frame = 0;
    const ctx = gsap.context(() => {}, surface);

    const unlock = () => {
      document.body.style.overflow = oldOverflow;
      page.inert = oldInert;
      if (oldBusy === null) page.removeAttribute("aria-busy");
      else page.setAttribute("aria-busy", oldBusy);
    };
    const complete = (playIntro: boolean) => {
      if (disposed) return;
      const restoreFocus = surface.contains(document.activeElement);
      unlock();
      try {
        sessionStorage.setItem(SESSION_KEY, "seen");
      } catch {
        /* Keep the welcome usable without storage. */
      }
      if (restoreFocus)
        page
          .querySelector<HTMLAnchorElement>(".wordmark")
          ?.focus({ preventScroll: true });
      onReady(playIntro && !reduced.matches);
    };
    const finish = (playIntro: boolean, immediate = false) => {
      if (disposed) return;
      if (immediate) {
        finishing = true;
        window.clearTimeout(deadline);
        window.clearTimeout(minimumTimer);
        ctx.revert();
        complete(false);
        return;
      }
      if (finishing) return;
      finishing = true;
      window.clearTimeout(deadline);
      window.clearTimeout(minimumTimer);
      setLeaving(true);
      ctx.add(() => {
        const circle = surface.querySelector<HTMLElement>(".spl-circle")!;
        const target = page.querySelector<HTMLElement>("[data-glass-backdrop]");
        if (reduced.matches || !target) {
          gsap.to(surface, {
            opacity: 0,
            duration: 0.2,
            ease: "power3.out",
            onComplete: () => complete(playIntro),
          });
          return;
        }
        const from = circle.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const transition = gsap.timeline({
          onComplete: () => complete(playIntro),
        });
        transition.to(
          ".spl-chrome, .spl-orbit, .spl-mark",
          { opacity: 0, duration: 0.2 },
          0,
        );
        transition.to(
          circle,
          {
            x: to.left + to.width / 2 - from.left - from.width / 2,
            y: to.top + to.height / 2 - from.top - from.height / 2,
            scale: to.width / from.width,
            duration: 0.65,
            ease: "power3.inOut",
          },
          0,
        );
        transition.to(".spl-backdrop", { opacity: 0, duration: 0.3 }, 0.32);
        transition.to(circle, { opacity: 0, duration: 0.15 }, 0.5);
      });
    };
    skip.current = () => finish(false, true);
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip.current();
      }
    };
    const preferenceChanged = () => {
      if (reduced.matches) skip.current();
    };
    document.addEventListener("keydown", escape);
    reduced.addEventListener("change", preferenceChanged);
    deadline = window.setTimeout(() => finish(true), MAX_WAIT_MS);

    // Decode the actual responsive hero images, sharing their existing requests.
    // Below-the-fold project images and network services never hold the entrance.
    const images = Array.from(
      page.querySelectorAll<HTMLImageElement>(".ph-hero img"),
    );
    const jobs = images.map((image) => {
      image.loading = "eager";
      return image.decode();
    });
    for (const font of [
      '400 48px "Jersey 10"',
      '400 16px "DM Sans"',
      '700 16px "DM Sans"',
      '400 12px "IBM Plex Mono"',
    ]) {
      jobs.push(document.fonts.load(font).then(() => {}));
    }
    let settled = 0;
    const markSettled = () => {
      settled += 1;
      if (!disposed && !finishing)
        setProgress(Math.round((settled / jobs.length) * 100));
    };
    void Promise.all(
      jobs.map((job) => job.then(markSettled, markSettled)),
    ).then(() => {
      if (disposed || finishing) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (disposed || finishing) return;
          const remaining = reduced.matches
            ? 0
            : Math.max(0, 650 - (performance.now() - started));
          minimumTimer = window.setTimeout(() => finish(true), remaining);
        });
      });
    });

    return () => {
      disposed = true;
      skip.current = () => {};
      window.clearTimeout(deadline);
      window.clearTimeout(minimumTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", escape);
      reduced.removeEventListener("change", preferenceChanged);
      ctx.revert();
      unlock();
    };
  }, [content, onReady]);

  return (
    <>
      <section
        ref={overlay}
        className="site-preloader"
        data-leaving={leaving}
        aria-label="Welcome to Mark’s portfolio"
      >
        <div className="spl-backdrop" />
        <div className="spl-chrome spl-top">
          <span>
            mark renzo<span className="spl-dot">.</span>
          </span>
          <span>CURIOUS BY DEFAULT</span>
        </div>
        <div className="spl-center" aria-hidden="true">
          <div className="spl-circle">
            <span className="spl-mark">
              mr<span>✳</span>
            </span>
          </div>
          <div className="spl-orbit spl-orbit-one">
            <span className="spl-sticker spl-play">PLAY</span>
          </div>
          <div className="spl-orbit spl-orbit-two">
            <span className="spl-sticker spl-whatif">
              what <b>if?</b>
            </span>
          </div>
          <div className="spl-orbit spl-orbit-three">
            <span className="spl-spark">✳</span>
          </div>
        </div>
        <div className="spl-chrome spl-message">
          <p>
            A little curiosity.
            <br />
            <span>A lot of possibility.</span>
          </p>
          <div className="spl-progress-row">
            <span role="status">
              {leaving ? "Let’s take a look." : "Getting things ready"}
            </span>
            <span aria-hidden="true">{String(progress).padStart(2, "0")}%</span>
          </div>
          <div
            className="spl-progress"
            role="progressbar"
            aria-label="Loading the portfolio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ transform: `scaleX(${progress / 100})` }} />
          </div>
        </div>
        <div className="spl-chrome spl-bottom">
          <span>AI BUILDER. HUMAN FIRST.</span>
          <button type="button" onClick={() => skip.current()}>
            Skip intro <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
      <noscript>
        <style>{".site-preloader{display:none!important}"}</style>
      </noscript>
    </>
  );
}

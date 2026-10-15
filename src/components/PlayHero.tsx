"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ArrowDown,
  ArrowUpRight,
  ArrowElbowDownLeft,
  ArrowCounterClockwise,
  Asterisk,
  Sparkle,
  Smiley,
  Pause,
  Play,
} from "@phosphor-icons/react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import LiquidGlassPortrait from "./LiquidGlassPortrait";
import HeroStickerField from "./HeroStickerField";
import "./play-hero.css";

type Props = {
  entrance?: "loading" | "play" | "skip";
  onAsk: (question: string) => void;
  isAsking: boolean;
  guideLabel: string;
  suggestions: string[];
  onExplore: () => void;
  onOpenProject: () => void;
  onCelebrate: () => void;
  onReset: () => void;
  onMoveSticker: (event: KeyboardEvent<HTMLElement>) => void;
};

const statement = "Good technology should feel a little more human.";

export default function PlayHero({
  entrance = "play",
  onAsk,
  isAsking,
  guideLabel,
  suggestions,
  onExplore,
  onOpenProject,
  onCelebrate,
  onReset,
  onMoveSticker,
}: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const marquee = useRef<gsap.core.Tween | null>(null);
  const tickerTrigger = useRef<ScrollTrigger | null>(null);
  const pausedRef = useRef(false);
  const [question, setQuestion] = useState("");
  const [paused, setPaused] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useLayoutEffect(() => {
    const hero = scope.current?.querySelector<HTMLElement>(".ph-hero");
    const circle = hero?.querySelector<HTMLElement>("[data-glass-backdrop]");
    if (!hero || !circle) return;
    if (entrance === "loading") {
      hero.dataset.intro = "loading";
      hero.dataset.preparing = "true";
      return () => {
        delete hero.dataset.preparing;
      };
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Direct section visits should open at their destination, without an intro.
    if (
      entrance === "skip" ||
      reduced.matches ||
      window.scrollY > 80 ||
      (location.hash && location.hash !== "#home")
    ) {
      hero.dataset.intro = "complete";
      hero.dispatchEvent(new Event("hero-intro-complete"));
      hero.dispatchEvent(new Event("hero-layout-change"));
      return;
    }
    gsap.registerPlugin(MotionPathPlugin);
    hero.dataset.intro = "running";
    const circleRect = circle.getBoundingClientRect();
    const center = {
      x: circleRect.left + circleRect.width / 2,
      y: circleRect.top + circleRect.height / 2,
    };
    const flights = Array.from(
      hero.querySelectorAll<HTMLElement>(".hsf-anchor, .ph-project-flight"),
    );
    const content = Array.from(
      hero.querySelectorAll<HTMLElement>(
        ".ph-title, .ph-introduction, .ph-note-card",
      ),
    );
    const chrome = Array.from(
      hero.querySelectorAll<HTMLElement>(
        ".ph-kicker, .ph-bottom, .ph-glass-scene",
      ),
    );
    const offset = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
        x: center.x - rect.left - rect.width / 2,
        y: center.y - rect.top - rect.height / 2,
      };
    };
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      hero.dataset.intro = "complete";
      hero.dispatchEvent(new Event("hero-intro-complete"));
      hero.dispatchEvent(new Event("hero-layout-change"));
    };
    let intro: gsap.core.Timeline;
    const ctx = gsap.context(() => {
      intro = gsap.timeline({
        defaults: { ease: "power4.out" },
        onComplete: finish,
      });
      intro.from(
        ".ph-hero-portrait",
        { opacity: 0, y: 24, duration: 0.65, clearProps: "opacity,transform" },
        0,
      );
      flights.forEach((element, index) => {
        const from = offset(element);
        const arc = (index % 2 ? -1 : 1) * Math.min(80, circleRect.width * 0.2);
        gsap.set(element, {
          ...from,
          scale: 0.9,
          rotation: index % 2 ? -18 : 18,
          opacity: 0,
        });
        intro.to(
          element,
          {
            motionPath: {
              path: [
                from,
                { x: from.x * 0.45 + arc, y: from.y * 0.45 - 30 },
                { x: 0, y: 0 },
              ],
              curviness: 1,
            },
            scale: 1,
            rotation: 0,
            opacity: 1,
            duration: 1.3,
            clearProps: "transform,opacity",
          },
          0.15 + index * 0.075,
        );
      });
      content.forEach((element, index) => {
        const from = offset(element);
        gsap.set(element, { opacity: 0 });
        intro.from(
          element,
          {
            x: from.x,
            y: from.y,
            scale: 0.95,
            duration: 1.05,
            clearProps: "transform",
          },
          0.3 + index * 0.075,
        );
        intro.to(
          element,
          { opacity: 1, duration: 0.45, clearProps: "opacity" },
          0.6 + index * 0.075,
        );
      });
      intro.from(
        chrome,
        { opacity: 0, duration: 0.5, stagger: 0.05, clearProps: "opacity" },
        0.85,
      );
    }, scope);
    // Interaction, resize, or scrolling always wins over the opening sequence.
    const skip = () => {
      if (!finished) intro.progress(1);
    };
    hero.addEventListener("pointerdown", skip, true);
    hero.addEventListener("focusin", skip);
    hero.addEventListener("hero-layout-reset", skip);
    window.addEventListener("scroll", skip, { passive: true });
    window.addEventListener("resize", skip);
    reduced.addEventListener("change", skip);
    return () => {
      hero.removeEventListener("pointerdown", skip, true);
      hero.removeEventListener("focusin", skip);
      hero.removeEventListener("hero-layout-reset", skip);
      window.removeEventListener("scroll", skip);
      window.removeEventListener("resize", skip);
      reduced.removeEventListener("change", skip);
      ctx.revert();
      delete hero.dataset.intro;
    };
  }, [entrance]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(".ph-asterisk", {
          rotation: 160,
          scrollTrigger: {
            trigger: ".ph-manifesto",
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
          ease: "none",
        });
        gsap.fromTo(
          ".ph-manifesto-word",
          { opacity: 0.17 },
          {
            opacity: 1,
            stagger: 0.15,
            ease: "none",
            scrollTrigger: {
              trigger: ".ph-manifesto-copy",
              start: "top 78%",
              end: "bottom 47%",
              scrub: 0.45,
            },
          },
        );
        gsap.from(".ph-rule", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".ph-manifesto",
            start: "top 86%",
            once: true,
          },
        });
        marquee.current = gsap.to(".ph-ticker-track", {
          xPercent: -50,
          duration: 23,
          repeat: -1,
          ease: "none",
          paused: true,
        });
        tickerTrigger.current = ScrollTrigger.create({
          trigger: ".ph-ticker",
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => {
            if (self.isActive && !pausedRef.current && !document.hidden)
              marquee.current?.play();
            else marquee.current?.pause();
          },
        });
        return () => {
          marquee.current = null;
          tickerTrigger.current = null;
        };
      });
    }, scope);
    return () => {
      mm.revert();
      ctx.revert();
      marquee.current = null;
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    const hero = scope.current?.querySelector<HTMLElement>(".ph-hero");
    if (hero) {
      hero.dataset.motionPaused = String(paused);
      hero.dispatchEvent(
        new CustomEvent("hero-motion-change", { detail: { paused } }),
      );
    }
    const sync = () =>
      marquee.current?.paused(
        paused || !tickerTrigger.current?.isActive || document.hidden,
      );
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [paused]);

  return (
    <div ref={scope} className="ph-root ph-liquid-root">
      <section
        className="ph-hero"
        aria-labelledby="hero-title"
        data-light="lime"
      >
        <div className="ph-atmosphere" aria-hidden="true" />
        <div className="ph-glass-scene">
          <LiquidGlassPortrait resetKey={resetKey} playful paused={paused} />
        </div>
        <HeroStickerField
          paused={paused}
          resetKey={resetKey}
          onCelebrate={onCelebrate}
          onMoveSticker={onMoveSticker}
        />
        <span className="sr-only" id="hero-drag-instructions">
          Drag the stickers, Courtfolio button or magnifying glass. Release to
          let them glide, or use arrow keys to move a focused item. Reset the
          scene to put everything back.
        </span>
        <div className="ph-kicker ph-intro-line">
          <span>
            <i /> MARK RENZO MARIVELES
          </span>
          <span>AI BUILDER & PRODUCT DEVELOPER</span>
          <span>ALWAYS UP FOR A GOOD IDEA</span>
        </div>
        <h1
          className="ph-title"
          id="hero-title"
          aria-label="Curious mind. Builder energy."
        >
          <span className="ph-line">
            <span className="ph-line-inner">Curious mind.</span>
          </span>
          <span className="ph-line ph-line-blue">
            <span className="ph-line-inner">Builder energy.</span>
          </span>
        </h1>
        <div className="ph-stage">
          <div
            className="ph-introduction ph-intro-line"
            role="group"
            aria-label="Mark’s introduction"
          >
            <span className="ph-small-arrow">
              <ArrowUpRight size={35} weight="light" />
            </span>
            <p>
              Hey, I’m Mark.
              <br />I turn ideas into{" "}
              <strong>apps, useful tools and automations with AI.</strong>
            </p>
            <p className="ph-introduction-small">
              A little strategy. A lot of making.
              <br />
              Always room for “what if.”
            </p>
            <button className="ph-explore" onClick={onExplore}>
              <span>See what I’ve built</span>
              <span className="ph-button-icon">
                <ArrowDown size={21} />
              </span>
            </button>
          </div>
          <div className="ph-collage">
            <div
              className="ph-portrait-anchor"
              data-glass-portrait-anchor=""
              role="group"
              aria-label="Mark’s portrait"
            >
              <div
                className="ph-portrait-backdrop ph-portrait-crop"
                data-glass-backdrop=""
              >
                <Image
                  className="ph-hero-portrait"
                  data-glass-portrait=""
                  src="/images/mark-hero.png"
                  width={1000}
                  height={1500}
                  sizes="(max-width: 800px) 60vw, 620px"
                  alt="Mark Renzo, the human behind the ideas"
                  preload
                  draggable={false}
                />
              </div>
            </div>
            <div className="ph-project-flight">
              <div className="ph-project-motion">
                <button
                  className="ph-project-peek"
                  onClick={onOpenProject}
                  onKeyDown={onMoveSticker}
                  aria-describedby="hero-drag-instructions"
                >
                  <span className="ph-project-dot" aria-hidden="true" />
                  Courtfolio <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          </div>
          <div className="ph-note-card" role="group" aria-label="Ask Mark’s AI">
            <div className="ph-note-top">
              <span>
                <i />
                <i />
                <i />
              </span>
              <span>LET’S MAKE SOMETHING</span>
              <Sparkle size={16} />
            </div>
            <div className="ph-note-body">
              <p>
                Got a curious
                <br />
                <span>question?</span>
              </p>
              <span className="ph-note-description">
                Ask my AI about a project,
                <br />
                get to know me, or try out an idea.
              </span>
              <form
                aria-busy={isAsking}
                onSubmit={(event) => {
                  event.preventDefault();
                  if (question.trim() && !isAsking) {
                    onAsk(question);
                    setQuestion("");
                  }
                }}
              >
                <label className="sr-only" htmlFor="hero-question">
                  Ask the site guide
                </label>
                <input
                  id="hero-question"
                  placeholder="What shall we build?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  maxLength={2000}
                  autoComplete="off"
                />
                <button
                  aria-label={
                    isAsking ? "Waiting for reply" : "Ask the site guide"
                  }
                  type="submit"
                  disabled={!question.trim() || isAsking}
                >
                  <ArrowElbowDownLeft size={21} />
                </button>
              </form>
              <div className="ph-prompts">
                {suggestions.slice(0, 2).map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={isAsking}
                    onClick={() => onAsk(text)}
                  >
                    <span className="ph-prompt-label">{text}</span>
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
              <span className="ph-demo-note" role="status">
                <i /> {guideLabel}
              </span>
            </div>
          </div>
        </div>
        <div className="ph-bottom">
          <button
            className="ph-motion-toggle"
            aria-label="Pause ambient motion"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume motion" : "Pause motion"}
          </button>
          <button
            onClick={() => {
              setResetKey((value) => value + 1);
              onReset();
            }}
          >
            <ArrowCounterClockwise size={14} /> Reset the scene
          </button>
          <button onClick={onExplore}>
            KEEP EXPLORING <ArrowDown size={15} />
          </button>
        </div>
      </section>

      <div
        className="ph-ticker"
        aria-label="Ideas, design, automation and a little play"
      >
        <div className="ph-ticker-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <div className="ph-ticker-copy" key={copy}>
              <span>GOOD IDEAS</span>
              <Asterisk weight="bold" />
              <span>HUMAN TOUCH</span>
              <Smiley />
              <span>A LITTLE PLAY</span>
              <Asterisk weight="bold" />
              <span>REAL THINGS</span>
              <Smiley />
            </div>
          ))}
        </div>
        <button
          className="ph-ticker-pause"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play moving text" : "Pause moving text"}
        >
          {paused ? (
            <Play size={13} weight="fill" />
          ) : (
            <Pause size={13} weight="fill" />
          )}
        </button>
      </div>

      <section
        className="ph-manifesto section-shell"
        aria-labelledby="manifesto-title"
      >
        <div className="ph-manifesto-aside">
          <span className="eyebrow">THE THREAD THAT CONNECTS IT ALL</span>
          <Asterisk className="ph-asterisk" size={110} weight="light" />
          <p>
            From telling stories
            <br />
            to building the systems
            <br />
            behind them.
          </p>
        </div>
        <div className="ph-manifesto-copy">
          <h2 id="manifesto-title">
            {statement.split(" ").map((word, index) => (
              <span
                className={`ph-manifesto-word ${index > 6 ? "ph-human-word" : ""}`}
                key={index}
              >
                {word}{" "}
              </span>
            ))}
          </h2>
          <div className="ph-rule" />
          <div className="ph-manifesto-detail">
            <p>
              My background in creative direction and digital marketing shapes
              how I build with AI. I start with what people need, then work out
              how to make it clearer, simpler, or easier to do.
            </p>
            <p>
              Sometimes that’s an AI agent.
              <br />
              Sometimes it’s a place for a community.
              <br />
              <strong>It always starts with people.</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

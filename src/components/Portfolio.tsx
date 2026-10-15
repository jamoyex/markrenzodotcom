"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowElbowDownLeft,
  X,
  List,
  Smiley,
  LinkedinLogo,
  InstagramLogo,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Draggable } from "gsap/Draggable";
import IdeaPreview from "./IdeaPreview";
import PlayHero from "./PlayHero";
import SitePreloader from "./SitePreloader";
import SelectedWork from "./SelectedWork";
import ExperienceAndSkills from "./ExperienceAndSkills";
import LifeCollage from "./LifeCollage";
import type { SiteAction } from "@/lib/guide";
import {
  advanceHeroMomentum,
  heroReleaseVelocity,
  type HeroMomentum,
  type HeroMotionBounds,
  type HeroMotionSample,
} from "@/lib/hero-physics";
import { normalizeGuideContext, type GuideContext } from "@/lib/quick-replies";
import useSiteGuide from "./useSiteGuide";

import type { ProjectId } from "@/lib/project-ids";
type PreviewKind = "dashboard" | "automation" | "website";
const HERO_DRAGGABLE_SELECTOR = ".draggable-sticker, .ph-project-peek";

export default function Portfolio() {
  const root = useRef<HTMLElement>(null);
  const [entrance, setEntrance] = useState<"loading" | "play" | "skip">(
    "loading",
  );
  const finishLoading = useCallback((playIntro: boolean) => {
    setEntrance(playIntro ? "play" : "skip");
  }, []);
  const particles = useRef<HTMLDivElement>(null);
  const draggables = useRef<Draggable[]>([]);
  const stickerMomentum = useRef<{
    stop: (target?: HTMLElement) => void;
    bounds: (target: HTMLElement) => HeroMotionBounds;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<GuideContext["section"]>("home");
  const activeSectionRef = useRef<GuideContext["section"]>("home");
  const [viewedProject, setViewedProject] = useState<ProjectId>();
  const [selectedWorkProject, setSelectedWorkProject] =
    useState<ProjectId>("courtfolio");
  const [previewContext, setPreviewContext] =
    useState<GuideContext["preview"]>();
  const previewContextRef = useRef<GuideContext["preview"]>(undefined);
  const [previewKind, setPreviewKind] = useState<PreviewKind>("dashboard");
  const [previewTitle, setPreviewTitle] = useState<string | undefined>();
  const [previewRunId, setPreviewRunId] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const guideContext = normalizeGuideContext({
    section: activeSection,
    project:
      viewedProject ||
      (activeSection === "work" ? selectedWorkProject : undefined),
    preview: previewContext,
  });
  const {
    element: guideElement,
    ask,
    startContact,
    guideLabel,
    isAsking,
    suggestions,
    guideVisible,
    guideNavigationUntil,
    setSuggestionFocus,
  } = useSiteGuide({
    context: guideContext,
    onAction: performAction,
    ready: entrance !== "loading",
  });

  const updatePreviewContext = useCallback(
    (next: NonNullable<GuideContext["preview"]>) => {
      const previous = previewContextRef.current;
      previewContextRef.current = next;
      setPreviewContext(next);
      if (
        activeSectionRef.current === "playground" &&
        (!guideVisible.current ||
          previous?.status !== next.status ||
          (previous?.prompt !== next.prompt &&
            Date.now() > guideNavigationUntil.current))
      ) {
        setSuggestionFocus("page");
      }
    },
    [],
  );

  const updateSelectedProject = useCallback((id: ProjectId) => {
    setSelectedWorkProject(id);
    if (
      activeSectionRef.current === "work" &&
      Date.now() > guideNavigationUntil.current
    ) {
      setViewedProject(undefined);
      setSuggestionFocus("page");
    }
  }, []);

  useEffect(() => {
    const sections = [
      "home",
      "work",
      "skills",
      "experience",
      "playground",
      "about",
      "contact",
    ] as const;
    let frame = 0;
    const readSection = () => {
      frame = 0;
      const readingLine = window.innerHeight * 0.38;
      const next = sections.find((id) => {
        const element =
          id === "home"
            ? root.current?.querySelector(".ph-hero")
            : document.getElementById(id);
        const box = element?.getBoundingClientRect();
        return box && box.top <= readingLine && box.bottom > readingLine;
      });
      if (!next || next === activeSectionRef.current) return;
      activeSectionRef.current = next;
      setActiveSection(next);
      setViewedProject(undefined);
      // Scrolling caused by an AI action must not replace its new follow-ups.
      if (!guideVisible.current || Date.now() > guideNavigationUntil.current)
        setSuggestionFocus("page");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(readSection);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Draggable);
    const mm = gsap.matchMedia();
    let dragResize: ResizeObserver | undefined;
    let dragResizeFrame = 0;
    let disposeMomentum = () => {};
    const notifyHeroLayout = () =>
      root.current
        ?.querySelector(".ph-hero")
        ?.dispatchEvent(new Event("hero-layout-change"));
    const ctx = gsap.context(() => {
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".site-header", {
          y: -30,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "all",
        });
        gsap.utils
          .toArray<HTMLElement>(".reveal")
          .filter((el) => !el.closest("[data-glass-mirror]"))
          .forEach((el) =>
            gsap.from(el, {
              y: 32,
              opacity: 0,
              duration: 0.75,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 92%", once: true },
              clearProps: "all",
            }),
          );
        gsap.from(".playground-section .ip-frame", {
          y: 50,
          rotateX: 5,
          scale: 0.94,
          transformPerspective: 1200,
          scrollTrigger: {
            trigger: ".playground-section",
            start: "top 85%",
            end: "top 15%",
            scrub: 1,
          },
          ease: "none",
        });
        gsap.from(".contact-main h2", {
          yPercent: 28,
          opacity: 0.1,
          scrollTrigger: {
            trigger: ".contact-section",
            start: "top 90%",
            end: "top 35%",
            scrub: 1,
          },
          ease: "none",
        });
        gsap.to(".contact-smile", {
          rotation: 120,
          scrollTrigger: {
            trigger: ".contact-section",
            start: "top bottom",
            end: "bottom bottom",
            scrub: 1,
          },
          ease: "none",
        });
        gsap.to(".reading-progress", {
          scaleX: 1,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.2 },
        });
      });
      mm.add(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const handlers: Array<() => void> = [];
          root.current
            ?.querySelectorAll<HTMLElement>(
              ".header-contact, .contact-cta, .ph-explore, .sw-open",
            )
            .forEach((button) => {
              if (button.closest("[data-glass-mirror]")) return;
              const xTo = gsap.quickTo(button, "x", {
                duration: 0.45,
                ease: "power3.out",
              });
              const yTo = gsap.quickTo(button, "y", {
                duration: 0.45,
                ease: "power3.out",
              });
              const move = (event: PointerEvent) => {
                const rect = button.getBoundingClientRect();
                xTo((event.clientX - rect.left - rect.width / 2) * 0.12);
                yTo((event.clientY - rect.top - rect.height / 2) * 0.22);
              };
              const leave = () => {
                xTo(0);
                yTo(0);
              };
              button.addEventListener("pointermove", move);
              button.addEventListener("pointerleave", leave);
              handlers.push(() => {
                button.removeEventListener("pointermove", move);
                button.removeEventListener("pointerleave", leave);
              });
            });
          return () => handlers.forEach((cleanup) => cleanup());
        },
      );
      const hero = root.current?.querySelector<HTMLElement>(".ph-hero");
      if (!hero) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
      const targets = Array.from(
        hero.querySelectorAll<HTMLElement>(HERO_DRAGGABLE_SELECTOR),
      ).filter((target) => !target.closest("[data-glass-mirror]"));
      const dragClickCleanups: Array<() => void> = [];
      const moving = new Map<
        HTMLElement,
        {
          drag: Draggable;
          motion: HeroMomentum;
          bounds: HeroMotionBounds;
        }
      >();
      let motionFrame = 0;
      let previousTime = 0;
      let visible = hero.getBoundingClientRect().bottom > 0;
      let paused = hero.dataset.motionPaused === "true";
      const isSuspended = () =>
        paused || reduce.matches || !visible || document.hidden;
      const signal = (target: HTMLElement, name: string) => {
        target.dispatchEvent(new CustomEvent(name, { bubbles: true }));
      };
      const bounds = (target: HTMLElement): HeroMotionBounds => {
        const area = hero.getBoundingClientRect();
        const piece = target.getBoundingClientRect();
        const x = Number(gsap.getProperty(target, "x"));
        const y = Number(gsap.getProperty(target, "y"));
        const minX = x + area.left + 3 - piece.left;
        const minY = y + area.top + 3 - piece.top;
        return {
          minX,
          maxX: Math.max(minX, x + area.right - 3 - piece.right),
          minY,
          maxY: Math.max(minY, y + area.bottom - 3 - piece.bottom),
        };
      };
      const stop = (target?: HTMLElement) => {
        if (target) moving.delete(target);
        else moving.clear();
        if (!moving.size) {
          cancelAnimationFrame(motionFrame);
          motionFrame = 0;
          previousTime = 0;
        }
      };
      function tick(now: number) {
        motionFrame = 0;
        if (isSuspended()) {
          previousTime = 0;
          return;
        }
        const seconds = previousTime
          ? Math.min((now - previousTime) / 1000, 0.05)
          : 0;
        previousTime = now;
        moving.forEach((body, target) => {
          body.motion = advanceHeroMomentum(body.motion, body.bounds, seconds);
          gsap.set(target, { x: body.motion.x, y: body.motion.y });
          body.drag.update();
          if (!body.motion.vx && !body.motion.vy) {
            moving.delete(target);
            signal(target, "hero-drag-settle");
          }
        });
        notifyHeroLayout();
        if (moving.size) motionFrame = requestAnimationFrame(tick);
        else previousTime = 0;
      }
      const syncMomentum = () => {
        if (isSuspended()) {
          cancelAnimationFrame(motionFrame);
          motionFrame = 0;
          previousTime = 0;
        } else if (moving.size && !motionFrame) {
          motionFrame = requestAnimationFrame(tick);
        }
      };
      const motionChange = (event: Event) => {
        paused = Boolean(
          (event as CustomEvent<{ paused: boolean }>).detail?.paused,
        );
        syncMomentum();
      };
      const resetMomentum = () => stop();
      const reduceChange = () => {
        if (reduce.matches) {
          const settled = [...moving.keys()];
          stop();
          settled.forEach((target) => signal(target, "hero-drag-settle"));
        }
        syncMomentum();
      };
      const intersection = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncMomentum();
      });
      intersection.observe(hero);
      hero.addEventListener("hero-motion-change", motionChange);
      hero.addEventListener("hero-layout-reset", resetMomentum);
      document.addEventListener("visibilitychange", syncMomentum);
      reduce.addEventListener("change", reduceChange);
      stickerMomentum.current = { stop, bounds };
      draggables.current = targets.flatMap((target) => {
        let samples: HeroMotionSample[] = [];
        let dragged = false;
        let suppressPointerClickUntil = 0;
        if (target.matches(".ph-project-peek")) {
          const preventDragClick = (event: MouseEvent) => {
            // Touch browsers can deliver their click after the drag ends.
            // Keyboard activation has detail: 0 and remains available.
            if (
              event.detail > 0 &&
              performance.now() < suppressPointerClickUntil
            ) {
              event.preventDefault();
              event.stopImmediatePropagation();
            }
          };
          target.addEventListener("click", preventDragClick, true);
          dragClickCleanups.push(() =>
            target.removeEventListener("click", preventDragClick, true),
          );
        }
        return Draggable.create(target, {
          type: "x,y",
          bounds: bounds(target),
          zIndexBoost: false,
          edgeResistance: 1,
          minimumMovement: 4,
          dragClickables: true,
          suppressClickOnDrag: true,
          onPressInit() {
            suppressPointerClickUntil = 0;
            stop(target);
            gsap.killTweensOf(target, "x,y,scale");
            signal(target, "hero-drag-start");
            this.applyBounds(bounds(target));
            this.update();
            samples = [{ x: this.x, y: this.y, time: performance.now() }];
            dragged = false;
          },
          onDragStart() {
            dragged = true;
            target.dataset.placed = "true";
          },
          onDrag() {
            const time = performance.now();
            samples.push({ x: this.x, y: this.y, time });
            samples = samples.filter((sample) => time - sample.time <= 140);
            notifyHeroLayout();
          },
          onRelease() {
            if (dragged) suppressPointerClickUntil = performance.now() + 500;
            const velocity = heroReleaseVelocity(samples, performance.now());
            if (dragged && !isSuspended() && (velocity.vx || velocity.vy)) {
              moving.set(target, {
                drag: Draggable.get(target),
                motion: { x: this.x, y: this.y, ...velocity },
                bounds: bounds(target),
              });
              syncMomentum();
            } else {
              signal(target, "hero-drag-settle");
            }
            samples = [];
            notifyHeroLayout();
          },
        });
      });
      dragResize = new ResizeObserver(() => {
        cancelAnimationFrame(dragResizeFrame);
        dragResizeFrame = requestAnimationFrame(() => {
          draggables.current.forEach((drag) => {
            const target = drag.target as HTMLElement;
            drag.applyBounds(bounds(target));
            drag.update();
            const body = moving.get(target);
            if (body) {
              body.bounds = bounds(target);
              body.motion.x = drag.x;
              body.motion.y = drag.y;
            }
          });
          notifyHeroLayout();
        });
      });
      dragResize.observe(hero);
      targets.forEach((target) => dragResize?.observe(target));
      disposeMomentum = () => {
        stop();
        dragClickCleanups.forEach((cleanup) => cleanup());
        stickerMomentum.current = null;
        intersection.disconnect();
        hero.removeEventListener("hero-motion-change", motionChange);
        hero.removeEventListener("hero-layout-reset", resetMomentum);
        document.removeEventListener("visibilitychange", syncMomentum);
        reduce.removeEventListener("change", reduceChange);
      };
    }, root);
    return () => {
      disposeMomentum();
      dragResize?.disconnect();
      cancelAnimationFrame(dragResizeFrame);
      draggables.current.forEach((item) => {
        gsap.killTweensOf(item.target);
        item.kill();
      });
      draggables.current = [];
      gsap.killTweensOf(window);
      if (particles.current) gsap.killTweensOf(particles.current.children);
      mm.revert();
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (
      !menuOpen ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const ctx = gsap.context(() => {
      gsap.from(".main-nav.is-open a", {
        y: 35,
        opacity: 0,
        stagger: 0.055,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "all",
      });
    }, root);
    return () => ctx.revert();
  }, [menuOpen]);

  function goTo(target: string) {
    setMenuOpen(false);
    const element = document.getElementById(target);
    if (!element) return;
    const section = normalizeGuideContext({ section: target }).section;
    if (section) {
      activeSectionRef.current = section;
      setActiveSection(section);
      setViewedProject(undefined);
      setSuggestionFocus("page");
    }
    const focusTarget = () => {
      const heading = element.querySelector<HTMLElement>("h1,h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.scrollIntoView();
      focusTarget();
    } else
      gsap.to(window, {
        scrollTo: { y: element, offsetY: 88 },
        duration: 1,
        ease: "power3.inOut",
        overwrite: "auto",
        onComplete: focusTarget,
      });
  }

  function openProject(id: ProjectId) {
    window.location.assign(`/work/${id}`);
  }

  function celebrate() {
    setCelebrated(true);
    if (
      !particles.current ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    gsap.killTweensOf(particles.current.children);
    particles.current.replaceChildren();
    for (let i = 0; i < 34; i++) {
      const piece = document.createElement("i");
      piece.style.background = ["#2453FF", "#DDEF8B", "#20211E"][i % 3];
      particles.current.appendChild(piece);
      gsap.fromTo(
        piece,
        {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.6,
          rotation: 0,
          opacity: 1,
        },
        {
          x: window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth,
          y: -100 + Math.random() * window.innerHeight,
          rotation: Math.random() * 540,
          opacity: 0,
          duration: 1.3 + Math.random(),
          ease: "power2.out",
          onComplete: () => piece.remove(),
        },
      );
    }
  }

  function resetStickers() {
    const hero = root.current?.querySelector(".ph-hero");
    const targets = Array.from(
      root.current?.querySelectorAll<HTMLElement>(HERO_DRAGGABLE_SELECTOR) ??
        [],
    ).filter((target) => !target.closest("[data-glass-mirror]"));
    if (!targets.length) return;
    stickerMomentum.current?.stop();
    targets.forEach((target) => delete target.dataset.placed);
    gsap.set(targets, { clearProps: "zIndex" });
    hero?.dispatchEvent(new Event("hero-layout-reset"));
    gsap.to(targets, {
      x: 0,
      y: 0,
      scale: 1,
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 0.6,
      ease: "back.out(1.3)",
      overwrite: "auto",
      onUpdate: () => {
        draggables.current.forEach((drag) => drag.update());
        hero?.dispatchEvent(new Event("hero-layout-change"));
      },
      onComplete: () => {
        draggables.current.forEach((drag) => {
          const bounds = stickerMomentum.current?.bounds(
            drag.target as HTMLElement,
          );
          if (bounds) drag.applyBounds(bounds);
          drag.update();
          (drag.target as HTMLElement).dispatchEvent(
            new CustomEvent("hero-drag-settle", { bubbles: true }),
          );
        });
        hero?.dispatchEvent(new Event("hero-layout-change"));
      },
    });
  }

  function moveSticker(event: React.KeyboardEvent<HTMLElement>) {
    if (
      event.target !== event.currentTarget ||
      !event.currentTarget.matches(HERO_DRAGGABLE_SELECTOR) ||
      event.currentTarget.closest("[data-glass-mirror]")
    )
      return;
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    )
      return;
    event.preventDefault();
    const target = event.currentTarget;
    const drag = Draggable.get(target);
    if (!drag) return;
    stickerMomentum.current?.stop(target);
    target.dispatchEvent(new CustomEvent("hero-drag-start", { bubbles: true }));
    gsap.killTweensOf(target, "x,y");
    const bounds = stickerMomentum.current?.bounds(target);
    if (bounds) drag.applyBounds(bounds);
    drag.update();
    target.dataset.placed = "true";
    const x =
      Number(gsap.getProperty(target, "x")) +
      (event.key === "ArrowRight" ? 16 : event.key === "ArrowLeft" ? -16 : 0);
    const y =
      Number(gsap.getProperty(target, "y")) +
      (event.key === "ArrowDown" ? 16 : event.key === "ArrowUp" ? -16 : 0);
    gsap.to(target, {
      x: gsap.utils.clamp(drag.minX, drag.maxX, x),
      y: gsap.utils.clamp(drag.minY, drag.maxY, y),
      duration: 0,
      overwrite: "auto",
      onUpdate: () => {
        drag.update();
        target
          .closest(".ph-hero")
          ?.dispatchEvent(new Event("hero-layout-change"));
      },
      onComplete: () => {
        drag.update();
        target.dispatchEvent(
          new CustomEvent("hero-drag-settle", { bubbles: true }),
        );
      },
    });
  }

  function performAction(action: SiteAction) {
    switch (action.type) {
      case "navigate":
        goTo(action.target);
        break;
      case "project":
        openProject(action.id);
        break;
      case "preview":
        setPreviewKind(action.kind);
        setPreviewTitle(action.title?.trim() || undefined);
        setPreviewRunId((previous) => previous + 1);
        goTo("playground");
        break;
      case "celebrate":
        celebrate();
        break;
      case "reset-stickers":
        resetStickers();
        goTo("home");
        break;
    }
  }

  return (
    <>
      {entrance === "loading" && (
        <SitePreloader content={root} onReady={finishLoading} />
      )}
      <main ref={root} id="home" className="portfolio-v2">
        <div className="reading-progress" aria-hidden="true" />
        <a className="skip-link" href="#work">
          Skip to selected work
        </a>
        <header className="site-header">
          <a
            href="#home"
            className="wordmark"
            aria-label="Mark Renzo home"
            onClick={(event) => {
              event.preventDefault();
              goTo("home");
            }}
          >
            mark renzo
            <span className="wordmark-square" />
          </a>
          <nav
            className={menuOpen ? "main-nav is-open" : "main-nav"}
            aria-label="Main navigation"
          >
            <a
              href="#work"
              onClick={(event) => {
                event.preventDefault();
                goTo("work");
              }}
            >
              Work
            </a>
            <a
              href="#skills"
              onClick={(event) => {
                event.preventDefault();
                goTo("skills");
              }}
            >
              Skills
            </a>
            <a
              href="#experience"
              onClick={(event) => {
                event.preventDefault();
                goTo("experience");
              }}
            >
              Experience
            </a>
            <a
              href="#playground"
              onClick={(event) => {
                event.preventDefault();
                goTo("playground");
              }}
            >
              Playground <span className="nav-dot" />
            </a>
            <a
              href="#about"
              onClick={(event) => {
                event.preventDefault();
                goTo("about");
              }}
            >
              The human
            </a>
          </nav>
          <a
            className="header-contact"
            href="#contact"
            onClick={(event) => {
              event.preventDefault();
              startContact();
            }}
          >
            Let’s talk <ArrowUpRight size={18} />
          </a>
          <button
            className="menu-button icon-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </header>

        <PlayHero
          entrance={entrance}
          onAsk={(text) => {
            void ask(text);
          }}
          isAsking={isAsking}
          guideLabel={guideLabel}
          suggestions={suggestions}
          onExplore={() => goTo("work")}
          onOpenProject={() => openProject("courtfolio")}
          onCelebrate={celebrate}
          onReset={resetStickers}
          onMoveSticker={moveSticker}
        />
        <SelectedWork
          onOpenProject={openProject}
          onExploreIdea={() => goTo("playground")}
          onProjectChange={updateSelectedProject}
        />
        <ExperienceAndSkills />

        <section
          id="playground"
          className="playground-section"
          aria-labelledby="playground-title"
        >
          <div className="section-shell">
            <div className="section-heading reveal">
              <div>
                <p className="eyebrow">YOUR IDEA. LET’S MAKE IT REAL.</p>
                <h2 id="playground-title">
                  What shall <br />
                  we <span>build?</span>
                </h2>
              </div>
              <div className="playground-intro">
                <span className="mini-key">
                  enter <ArrowElbowDownLeft size={26} />
                </span>
                <p>
                  I build apps, websites and automations for businesses like
                  yours.
                  <br />
                  Tell me what you have in mind. Try a first preview below, then
                  let’s bring it to life.
                </p>
              </div>
            </div>
            <div className="reveal">
              <IdeaPreview
                kind={previewKind}
                title={previewTitle}
                runId={previewRunId}
                onKindChange={(kind) => {
                  setPreviewKind(kind);
                  setPreviewTitle(undefined);
                }}
                onContact={startContact}
                onContextChange={updatePreviewContext}
              />
            </div>
          </div>
        </section>

        <section
          id="about"
          className="about-section section-shell about-playfield"
          aria-labelledby="about-title"
        >
          <LifeCollage />
          <div className="about-copy reveal">
            <p className="eyebrow">A LITTLE OF LIFE OUTSIDE WORK</p>
            <h2 id="about-title">
              A whole life.
              <br />
              <span>Beyond the screen.</span>
            </h2>
            <p>
              I’m Mark Renzo Mariveles. I build applications and tools with AI,
              drawing on creative work and digital marketing. I like making
              things that are useful, easy to use, and a little unexpected.
            </p>
            <p>
              There’s more to share than what’s on my screen. A trip along the
              Great Ocean Road. Conversations at Startup Sips. A few people and
              places I’m glad I made time for.
            </p>
            <div className="about-notes">
              <span>
                <span className="tiny-square" /> AI + AUTOMATION
              </span>
              <span>
                <span className="tiny-square" /> DIGITAL EXPERIENCES
              </span>
              <span>
                <span className="tiny-square" /> ALWAYS EXPLORING
              </span>
            </div>
            <a
              className="text-link"
              href="https://www.instagram.com/jamoyex/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Find me on Instagram <ArrowUpRight size={20} />
            </a>
          </div>
        </section>

        <section
          id="contact"
          className="contact-section"
          aria-labelledby="contact-title"
        >
          <div className="section-shell">
            <div className="contact-top reveal">
              <p className="eyebrow">GOOD THINGS START WITH A HELLO</p>
              <span className="contact-smile">
                <Smiley size={34} />
              </span>
            </div>
            <div className="contact-main reveal">
              <h2 id="contact-title">
                GOT A GOOD
                <br />
                <span>“WHAT IF”?</span>
              </h2>
              <div className="contact-copy">
                <p>
                  An idea you want to build, a process you want to fix, or a
                  “could we make this?” you can’t stop thinking about.
                  <br />
                  <br />
                  I’d love to hear it.
                </p>
                <a
                  className="contact-cta"
                  href="#contact"
                  onClick={(event) => {
                    event.preventDefault();
                    startContact();
                  }}
                >
                  Tell me your idea <ArrowUpRight size={28} />
                </a>
              </div>
            </div>
            <div className="contact-bottom">
              <span>SMALL STARTS. BIG POSSIBILITIES.</span>
              <div>
                <a
                  href="https://www.linkedin.com/in/markrenzo/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkedinLogo size={17} /> LinkedIn <ArrowUpRight size={14} />
                </a>
                <a
                  href="https://www.instagram.com/jamoyex/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <InstagramLogo size={17} /> Instagram{" "}
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>
        <footer className="site-footer section-shell">
          <a
            className="wordmark"
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              goTo("home");
            }}
          >
            mark renzo
            <span className="wordmark-square" />
          </a>
          <p>A little curiosity. A lot of possibility.</p>
          <button onClick={() => goTo("home")}>
            BACK TO TOP <ArrowUpRight size={16} />
          </button>
        </footer>

        {guideElement}

        <div className="confetti-layer" ref={particles} aria-hidden="true" />
        <span className="sr-only" role="status">
          {celebrated ? "A little celebration. What shall we make next?" : ""}
        </span>
      </main>
    </>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
} from "@phosphor-icons/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import "./selected-work.css";

import type { ProjectId } from "@/lib/project-ids";
import { projects } from "@/data/projects";
import ProjectPoster from "./ProjectPoster";
type SelectedWorkProps = {
  onOpenProject: (id: ProjectId) => void;
  onExploreIdea: () => void;
  onProjectChange?: (id: ProjectId) => void;
};

const chapters = projects;

export default function SelectedWork({
  onOpenProject,
  onExploreIdea,
  onProjectChange,
}: SelectedWorkProps) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const navigate = useRef<((index: number) => void) | null>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    onProjectChange?.(chapters[active].id);
  }, [active, onProjectChange]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
    const section = root.current;
    const viewport = stage.current;
    const rail = track.current;
    if (!section || !viewport || !rail) return;

    const panels = Array.from(
      rail.querySelectorAll<HTMLElement>(".sw-chapter"),
    );
    const mm = gsap.matchMedia();
    let navigationTween: gsap.core.Tween | undefined;
    let refreshFrame = 0;
    let disposed = false;

    const updateActive = (index: number) => {
      if (activeRef.current === index) return;
      activeRef.current = index;
      setActive(index);
    };

    const ctx = gsap.context(() => {
      mm.add(
        {
          all: "all",
          desktop:
            "(min-width: 1024px) and (min-height: 660px) and (hover: hover) and (pointer: fine)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (media) => {
          const desktop = !!media.conditions?.desktop;
          const reduce = !!media.conditions?.reduce;
          const pinned = desktop && !reduce;
          section.dataset.swPinned = String(pinned);
          setIsPinned(pinned);

          const setPanelAccess = (index: number) => {
            panels.forEach((panel, position) => {
              panel.inert = pinned && position !== index;
            });
          };

          if (pinned) {
            const horizontal = gsap.to(rail, {
              x: () => -(rail.scrollWidth - viewport.clientWidth),
              ease: "none",
              scrollTrigger: {
                trigger: viewport,
                start: "top top",
                end: () => `+=${rail.scrollWidth - viewport.clientWidth}`,
                pin: true,
                scrub: 0.7,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                  const index = Math.min(
                    chapters.length - 1,
                    Math.round(self.progress * (chapters.length - 1)),
                  );
                  updateActive(index);
                  setPanelAccess(index);
                  if (progress.current)
                    progress.current.style.transform = `scaleX(${self.progress})`;
                },
              },
            });
            setPanelAccess(activeRef.current);

            panels.forEach((panel) => {
              const artwork = panel.querySelector(".sw-artwork");
              if (artwork)
                gsap.fromTo(
                  artwork,
                  { xPercent: 6 },
                  {
                    xPercent: -6,
                    ease: "none",
                    scrollTrigger: {
                      trigger: panel,
                      containerAnimation: horizontal,
                      start: "left right",
                      end: "right left",
                      scrub: true,
                    },
                  },
                );
              panel
                .querySelectorAll<HTMLElement>(".sw-depth")
                .forEach((element, index) => {
                  gsap.fromTo(
                    element,
                    { y: index % 2 ? -32 : 32, rotation: index % 2 ? 5 : -7 },
                    {
                      y: index % 2 ? 32 : -32,
                      rotation: index % 2 ? -1 : -3,
                      ease: "none",
                      scrollTrigger: {
                        trigger: panel,
                        containerAnimation: horizontal,
                        start: "left right",
                        end: "right left",
                        scrub: true,
                      },
                    },
                  );
                });
            });

            navigate.current = (index) => {
              const trigger = horizontal.scrollTrigger;
              if (!trigger) return;
              navigationTween?.kill();
              navigationTween = gsap.to(window, {
                scrollTo: {
                  y:
                    trigger.start +
                    (trigger.end - trigger.start) *
                      (index / (chapters.length - 1)),
                  autoKill: true,
                },
                duration: 0.85,
                ease: "power3.inOut",
                overwrite: "auto",
              });
            };
          } else {
            panels.forEach((panel) => {
              panel.inert = false;
            });
            navigate.current = (index) => {
              panels[index]?.scrollIntoView({
                behavior: reduce ? "instant" : "smooth",
                block: "start",
              });
            };
            panels.forEach((panel, index) => {
              ScrollTrigger.create({
                trigger: panel,
                start: "top center",
                end: "bottom center",
                onEnter: () => updateActive(index),
                onEnterBack: () => updateActive(index),
              });
              if (!reduce)
                gsap.from(panel.querySelector(".sw-artwork"), {
                  y: 35,
                  opacity: 0,
                  duration: 0.8,
                  ease: "power3.out",
                  clearProps: "all",
                  scrollTrigger: {
                    trigger: panel,
                    start: "top 85%",
                    once: true,
                  },
                });
            });
          }

          return () => {
            navigationTween?.kill();
            panels.forEach((panel) => {
              panel.inert = false;
            });
            delete section.dataset.swPinned;
            navigate.current = null;
          };
        },
      );
    }, section);

    // Re-measure after local fonts settle; image dimensions are reserved in CSS.
    void document.fonts.ready.then(() => {
      if (!disposed)
        refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(refreshFrame);
      navigationTween?.kill();
      mm.revert();
      ctx.revert();
      navigate.current = null;
    };
  }, []);

  function goToChapter(index: number) {
    navigate.current?.(Math.max(0, Math.min(chapters.length - 1, index)));
  }

  return (
    <section
      ref={root}
      id="work"
      className="sw-section"
      aria-labelledby="sw-heading"
    >
      <div className="sw-intro">
        <div className="sw-intro-top">
          <span>SELECTED WORK / 01—06</span>
          <span>
            FROM “WHAT IF” TO SOMETHING REAL <ArrowDown size={14} />
          </span>
        </div>
        <div className="sw-intro-main">
          <h2 id="sw-heading">
            Ideas are good.
            <br />
            <span>Making is better.</span>
            <i aria-hidden="true" />
          </h2>
          <p>
            Apps, tools, and the systems behind them. Six things I’ve made, from
            the first screen to the details underneath.
          </p>
        </div>
      </div>
      <div ref={stage} className="sw-stage">
        <div className="sw-toolbar">
          <span className="sw-counter">
            <b>{String(active + 1).padStart(2, "0")}</b>
            <span>/ {String(chapters.length).padStart(2, "0")}</span>
          </span>
          <nav className="sw-chapter-nav" aria-label="Selected projects">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.id}
                type="button"
                aria-current={active === index ? "true" : undefined}
                onClick={() => goToChapter(index)}
              >
                <span className="sw-nav-dot" />
                {chapter.name}
              </button>
            ))}
          </nav>
          <div className="sw-controls">
            <span className="sw-scroll-hint">
              {isPinned ? "SCROLL TO EXPLORE" : "EXPLORE THE WORK"}
            </span>
            <button
              type="button"
              onClick={() => goToChapter(active - 1)}
              disabled={active === 0}
              aria-label="Previous project"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => goToChapter(active + 1)}
              disabled={active === chapters.length - 1}
              aria-label="Next project"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
        <div className="sw-window">
          <div ref={track} className="sw-track">
            {projects.map((project, index) => (
              <article
                key={project.id}
                className="sw-chapter"
                style={
                  {
                    "--project-accent": project.accent,
                    "--project-ink": project.accentInk,
                  } as CSSProperties
                }
                aria-labelledby={`sw-${project.id}-title`}
                id={`sw-${project.id}`}
              >
                <div className="sw-project-copy">
                  <div className="sw-project-kicker">
                    <span>
                      {String(index + 1).padStart(2, "0")} / {project.category}
                    </span>
                    <span>BY MARK RENZO</span>
                  </div>
                  <h3 id={`sw-${project.id}-title`}>
                    {project.name}
                    <span className="sw-title-dot">.</span>
                  </h3>
                  <p className="sw-project-lead">{project.headline}</p>
                  <p className="sw-summary">{project.summary}</p>
                  <p className="sw-audience">
                    <span>MADE FOR</span>
                    {project.audience}
                  </p>
                  <a
                    className="sw-project-cta"
                    href={`/work/${project.id}`}
                    onClick={(event) => {
                      if (
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey &&
                        event.button === 0
                      ) {
                        event.preventDefault();
                        onOpenProject(project.id);
                      }
                    }}
                  >
                    <span>Inside {project.name}</span>
                    <ArrowUpRight size={22} />
                  </a>
                  <div className="sw-project-bottom">
                    <span>EXPLORE THE PRODUCT. READ THE STORY.</span>
                    <span>{String(index + 1).padStart(2, "0")} — 06</span>
                  </div>
                </div>
                <div className="sw-visual">
                  <div className="sw-artwork">
                    <ProjectPoster
                      projectId={project.id}
                      onOpen={onOpenProject}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="sw-progress" aria-hidden="true">
          <span ref={progress} />
        </div>
      </div>
      <div className="sw-outro">
        <p>Your next idea could live here.</p>
        <button type="button" onClick={onExploreIdea}>
          Let’s try it <ArrowUpRight size={20} />
        </button>
      </div>
    </section>
  );
}

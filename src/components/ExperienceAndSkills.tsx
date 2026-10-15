"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BracketsCurly,
  MapPin,
  Plus,
} from "@phosphor-icons/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { capabilityGroups, workExperience } from "../data/profile";
import "./experience-skills.css";

/** Native disclosures keep all skills and career content readable without motion. */
export default function ExperienceAndSkills() {
  const root = useRef<HTMLDivElement>(null);
  const skillsSection = useRef<HTMLElement>(null);
  const careerGrid = useRef<HTMLDivElement>(null);
  const careerRail = useRef<HTMLDivElement>(null);
  const careerList = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const roleNodes = useRef<(HTMLLIElement | null)[]>([]);
  const disclosures = useRef(new Map<HTMLElement, gsap.core.Tween>());
  const refreshFrame = useRef<number | null>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const chapter = workExperience[activeChapter];

  function refreshLayout() {
    if (refreshFrame.current !== null)
      cancelAnimationFrame(refreshFrame.current);
    refreshFrame.current = requestAnimationFrame(() => {
      refreshFrame.current = null;
      ScrollTrigger.refresh();
    });
  }

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          all: "(min-width: 0px)",
          desktop: "(min-width: 1000px)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (state) => {
          if (state.conditions?.reduced) return;
          gsap
            .timeline({
              scrollTrigger: {
                trigger: skillsSection.current,
                start: "top 78%",
                once: true,
              },
            })
            .from(".es-heading-line > span", {
              yPercent: 105,
              duration: 0.8,
              stagger: 0.08,
              ease: "power3.out",
            })
            .from(
              ".es-toolbox-stamp",
              {
                rotation: -12,
                y: 35,
                opacity: 0,
                duration: 0.65,
                ease: "power3.out",
              },
              0.15,
            );
          gsap.fromTo(
            ".es-type-track",
            { x: 30 },
            {
              x: -180,
              ease: "none",
              scrollTrigger: {
                trigger: ".es-type-strip",
                start: "top bottom",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
          if (
            state.conditions?.desktop &&
            careerRail.current &&
            careerList.current
          ) {
            ScrollTrigger.create({
              trigger: careerGrid.current,
              start: "top 112px",
              end: () =>
                `+=${Math.max(0, (careerList.current?.offsetHeight ?? 0) - (careerRail.current?.offsetHeight ?? 0))}`,
              pin: careerRail.current,
              pinSpacing: false,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            });
          }
          gsap.fromTo(
            progress.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: careerList.current,
                start: "top 55%",
                end: "bottom 55%",
                scrub: true,
              },
            },
          );
          roleNodes.current.forEach((node, index) => {
            if (!node) return;
            ScrollTrigger.create({
              trigger: node,
              start: "top 58%",
              end: "bottom 58%",
              onEnter: () => setActiveChapter(index),
              onEnterBack: () => setActiveChapter(index),
            });
            gsap.from(node.querySelector(".es-role-copy"), {
              y: 26,
              opacity: 0.38,
              ease: "none",
              scrollTrigger: {
                trigger: node,
                start: "top 95%",
                end: "top 65%",
                scrub: true,
              },
            });
          });
        },
      );
    }, root);
    const animations = disclosures.current;
    return () => {
      animations.forEach((animation) => animation.kill());
      animations.clear();
      if (refreshFrame.current !== null)
        cancelAnimationFrame(refreshFrame.current);
      media.revert();
      context.revert();
    };
  }, []);

  function toggleDiscipline(event: MouseEvent<HTMLElement>) {
    const details = event.currentTarget.parentElement as HTMLDetailsElement;
    const body = details.querySelector<HTMLElement>(".es-discipline-body");
    if (!body) return;
    disclosures.current.get(body)?.kill();
    disclosures.current.delete(body);
    // Native keyboard and reduced-motion disclosure changes stay immediate.
    if (
      event.detail === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      gsap.set(body, { clearProps: "height,opacity" });
      delete details.dataset.transition;
      return;
    }
    event.preventDefault();
    const opening = !details.open || details.dataset.transition === "closing";
    const startHeight = details.open ? body.getBoundingClientRect().height : 0;
    const startOpacity = details.open
      ? Number(gsap.getProperty(body, "opacity"))
      : 0;
    details.open = true;
    details.dataset.transition = opening ? "opening" : "closing";
    const animation = gsap.fromTo(
      body,
      { height: startHeight, opacity: startOpacity },
      {
        height: opening ? body.scrollHeight : 0,
        opacity: opening ? 1 : 0,
        duration: 0.24,
        ease: "power3.out",
        onComplete: () => {
          details.open = opening;
          delete details.dataset.transition;
          gsap.set(body, { clearProps: "height,opacity" });
          disclosures.current.delete(body);
          refreshLayout();
        },
      },
    );
    disclosures.current.set(body, animation);
  }

  return (
    <div ref={root} className="es-root">
      <section
        id="skills"
        ref={skillsSection}
        className="es-skills"
        aria-labelledby="skills-title"
      >
        <div className="es-shell">
          <div className="es-skills-heading">
            <div>
              <p className="es-kicker">The toolbox / built for making</p>
              <h2 id="skills-title" className="es-skills-title" tabIndex={-1}>
                <span className="es-heading-line">
                  <span>How I work.</span>
                </span>
                <span className="es-heading-line">
                  <span>What I work with.</span>
                </span>
              </h2>
            </div>
            <div className="es-skills-intro">
              <div className="es-toolbox-stamp" aria-hidden="true">
                <BracketsCurly size={40} weight="bold" />
              </div>
              <p>
                These days, most of my work is making applications, tools and
                automations. I build with AI, taking ideas from a first
                prototype to something people can actually use.
              </p>
              <span className="es-open-cue">
                OPEN A DRAWER <ArrowDownRight size={21} aria-hidden="true" />
              </span>
            </div>
          </div>
          <div className="es-disciplines">
            {capabilityGroups.map((group, index) => (
              <details
                className="es-discipline"
                key={group.id}
                open={index === 0}
                onToggle={refreshLayout}
              >
                <summary onClick={toggleDiscipline}>
                  <span className="es-discipline-number">
                    /{String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="es-discipline-title">{group.title}</span>
                  <span className="es-discipline-count">
                    {group.tools.length
                      ? `${group.tools.length} tools in the mix`
                      : "IN PRACTICE"}
                  </span>
                  <span className="es-discipline-toggle" aria-hidden="true">
                    <Plus weight="bold" />
                  </span>
                </summary>
                <div className="es-discipline-body">
                  <div className="es-discipline-content">
                    <div>
                      <p className="es-discipline-description">
                        {group.description}
                      </p>
                      <ul
                        className="es-capability-skills"
                        aria-label={`${group.title} skills`}
                      >
                        {group.skills.map((skill) => (
                          <li key={skill}>{skill}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="es-tools-label">
                        {group.tools.length
                          ? "Some tools I reach for"
                          : group.id === "creative"
                            ? "From idea to final cut"
                            : "Working together"}
                      </p>
                      {group.tools.length ? (
                        <ul
                          className="es-tools-list"
                          aria-label={`${group.title} tools`}
                        >
                          {group.tools.map((tool) => (
                            <li key={tool}>{tool}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="es-discipline-remark">
                          {group.id === "creative"
                            ? "I bring the same eye for storytelling to event coverage, video and social content."
                            : "I keep people informed, coordinate the work and help the team get it over the line."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <div className="es-skills-bottom">
            <span>
              FROM THE FIRST IDEA.
              <br />
              TO A WORKING APPLICATION.
            </span>
            <span>
              Think it through. Build with AI.
              <br />
              Ship it. Keep improving. <ArrowDownRight aria-hidden="true" />
            </span>
          </div>
        </div>
        <div className="es-type-strip" aria-hidden="true">
          <div className="es-type-track">
            <span>THINK.</span>
            <span>✳</span>
            <span>BUILD.</span>
            <span>✳</span>
            <span>SHIP.</span>
            <span>REPEAT.</span>
          </div>
        </div>
      </section>

      <section
        id="experience"
        className="es-experience"
        aria-labelledby="experience-title"
      >
        <div className="es-shell">
          <div className="es-experience-top">
            <p className="es-kicker">Experience / the story so far</p>
            <a
              href="https://www.linkedin.com/in/markrenzo/"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="es-career-grid" ref={careerGrid}>
            <div className="es-career-rail" ref={careerRail}>
              <h2
                id="experience-title"
                className="es-career-title"
                tabIndex={-1}
              >
                My work,
                <br />
                so far.
                <br />
                <span>Since 2014.</span>
              </h2>
              <p className="es-career-intro">
                My work has taken me from video production through business
                development and marketing to building applications and
                automations with AI.
              </p>
              <div className="es-year-window" aria-hidden="true">
                <span className="es-year-number">
                  {chapter.startDate.slice(0, 4)}
                </span>
                <span className="es-year-caption">
                  BACK THROUGH THE CHAPTERS
                </span>
              </div>
              <div className="es-chapter-counter" aria-hidden="true">
                <span>
                  {String(activeChapter + 1).padStart(2, "0")} /{" "}
                  {String(workExperience.length).padStart(2, "0")}
                </span>
                <span>
                  {activeChapter < 5 ? "RECENT CHAPTERS" : "EARLIER CHAPTERS"}
                </span>
              </div>
            </div>
            <div className="es-career-list-wrap" ref={careerList}>
              <div className="es-career-spine" aria-hidden="true">
                <div ref={progress} className="es-career-progress" />
              </div>
              <ol className="es-career-list">
                {workExperience.map((experience, index) => (
                  <li
                    key={experience.id}
                    ref={(node) => {
                      roleNodes.current[index] = node;
                    }}
                    className={`es-experience-item${index >= 5 ? " es-role-compact" : ""}`}
                    data-active={index === activeChapter}
                  >
                    <div className="es-role-copy">
                      <p className="es-role-dates">
                        <span>{experience.period}</span>
                        {experience.isCurrent && (
                          <span className="es-current-label">CURRENT</span>
                        )}
                      </p>
                      <h3 className="es-role-company">{experience.company}</h3>
                      <p className="es-role-title">{experience.role}</p>
                      <div className="es-role-meta">
                        <span>{experience.employmentType}</span>
                        <span>
                          <MapPin size={12} aria-hidden="true" />
                          {experience.location}
                        </span>
                      </div>
                      {index < 5 && (
                        <p className="es-role-summary">{experience.summary}</p>
                      )}
                      {(experience.description || experience.companyUrl) && (
                        <details
                          className="es-role-notes"
                          onToggle={refreshLayout}
                        >
                          <summary>
                            {index < 5
                              ? "More about this role"
                              : "What I worked on"}{" "}
                            <Plus size={13} aria-hidden="true" />
                          </summary>
                          <div className="es-role-notes-copy">
                            {experience.description && (
                              <p>{experience.description}</p>
                            )}
                            {experience.companyUrl && (
                              <a
                                href={experience.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Visit{" "}
                                {experience.company ===
                                "Bank of the Philippine Islands (BPI)"
                                  ? "BPI"
                                  : experience.company}{" "}
                                <ArrowUpRight size={12} aria-hidden="true" />
                              </a>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="es-career-footer">
            <p>
              I’ve worked in full-time, contract, part-time and freelance roles.
              <br />
              That experience shapes the applications and tools I build today.
            </p>
            <a href="#about">
              Meet the person behind it{" "}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

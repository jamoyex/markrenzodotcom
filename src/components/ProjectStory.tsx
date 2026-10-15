"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Sparkle,
} from "@phosphor-icons/react";
import gsap from "gsap";
import type { ProjectCaseStudy } from "@/data/projects";
import ProjectDemo, { ProjectFeatureGallery } from "./ProjectDemo";
import "./project-story.css";
import useSiteGuide from "./useSiteGuide";
import type { SiteAction } from "@/lib/guide";

type Props = {
  project: ProjectCaseStudy;
  next: Pick<ProjectCaseStudy, "id" | "name" | "category" | "headline">;
  number: number;
};

export default function ProjectStory({ project, next, number }: Props) {
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const { element: guideElement, startContact } = useSiteGuide({
    context: { section: "work", project: project.id },
    onAction: (action: SiteAction) => {
      if (action.type === "project") {
        if (action.id === project.id) {
          document
            .getElementById("project-showcase")
            ?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            });
        } else window.location.assign(`/work/${action.id}`);
      } else if (action.type === "navigate") {
        window.location.assign(`/#${action.target}`);
      } else if (action.type === "preview") {
        window.location.assign("/#playground");
      } else {
        window.location.assign("/#home");
      }
    },
  });
  const wordCount = [
    ...project.intro,
    ...project.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
    ]),
  ]
    .join(" ")
    .split(/\s+/).length;

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${range > 0 ? Math.min(1, window.scrollY / range) : 1})`;
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    const media = gsap.matchMedia();
    const observers: IntersectionObserver[] = [];
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".ps-enter", {
          y: 22,
          opacity: 0,
          stagger: 0.07,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform,opacity",
        });
        const blocks = element.querySelectorAll<HTMLElement>(".ps-reveal");
        // Keep content visible until JS is ready, and reveal only once on entry.
        gsap.set(blocks, { y: 24, opacity: 0 });
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              gsap.to(entry.target, {
                y: 0,
                opacity: 1,
                duration: 0.65,
                ease: "power3.out",
                clearProps: "transform,opacity",
              });
              observer.unobserve(entry.target);
            });
          },
          { threshold: 0.08 },
        );
        blocks.forEach((block) => observer.observe(block));
        observers.push(observer);
        return () => {
          observer.disconnect();
          gsap.set(blocks, { clearProps: "transform,opacity" });
        };
      });
    }, element);
    const pauseVideo = () => {
      if (document.hidden) video.current?.pause();
    };
    document.addEventListener("visibilitychange", pauseVideo);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      document.removeEventListener("visibilitychange", pauseVideo);
      observers.forEach((observer) => observer.disconnect());
      media.revert();
      context.revert();
    };
  }, [project.id]);

  return (
    <main
      ref={root}
      className="project-story"
      style={
        {
          "--project-accent": project.accent,
          "--project-accent-ink": project.accentInk,
        } as CSSProperties
      }
    >
      <a className="ps-skip" href="#project-article">
        Skip to the story
      </a>
      <header className="ps-nav">
        <a className="ps-wordmark" href="/" aria-label="Mark Renzo home">
          mark renzo
          <span />
        </a>
        <span className="ps-nav-label">AI BUILDER &amp; PRODUCT DEVELOPER</span>
        <a className="ps-back" href="/#work">
          <ArrowLeft size={16} />
          All work
        </a>
        <div className="ps-reading-progress" aria-hidden="true">
          <span ref={progress} />
        </div>
      </header>

      <div className="ps-shell">
        <section className="ps-hero" aria-labelledby="project-title">
          <div className="ps-eyebrow ps-enter">
            <span>SELECTED WORK / {String(number).padStart(2, "0")}</span>
            <span>{project.category}</span>
            <span>A PROJECT BY MARK RENZO</span>
          </div>
          <h1 id="project-title" className="ps-enter">
            {project.name}
            <span>.</span>
          </h1>
          <div className="ps-hero-bottom ps-enter">
            <p className="ps-headline">{project.headline}</p>
            <div className="ps-intro-summary">
              <p>{project.summary}</p>
              <div className="ps-hero-actions">
                <a href="#project-showcase">
                  Explore the screens <ArrowDown size={16} />
                </a>
                {project.website && (
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit the site <ArrowUpRight size={16} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <section
          id="project-showcase"
          className="ps-demo-section ps-enter"
          aria-label={`${project.name} product showcase`}
        >
          <ProjectDemo projectId={project.id} />
        </section>

        <div className="ps-facts ps-reveal">
          <div>
            <span>WHAT IT IS</span>
            <p>{project.category}</p>
          </div>
          <div>
            <span>WHO IT’S FOR</span>
            <p>{project.audience}</p>
          </div>
          <div>
            <span>READING TIME</span>
            <p>
              {Math.max(2, Math.ceil(wordCount / 210))} minutes, give or take.
            </p>
          </div>
        </div>

        <ProjectFeatureGallery projectId={project.id} />

        <div className="ps-editorial" id="project-article">
          <aside className="ps-toc">
            <span>IN THIS STORY</span>
            <nav aria-label="In this project story">
              <a href="#overview">A little context</a>
              {project.sections.map((section) => (
                <a href={`#${section.id}`} key={section.id}>
                  {section.title}
                </a>
              ))}
              <a href="#project-stack">What’s underneath</a>
            </nav>
            <p>
              Written by Mark Renzo
              <br />
              <span>Builder, and a curious human.</span>
            </p>
          </aside>
          <article
            className="ps-article"
            aria-label={`The story of ${project.name}`}
          >
            <section id="overview" className="ps-overview ps-reveal">
              <p className="ps-section-label">A LITTLE CONTEXT</p>
              {project.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
            {project.sections.map((section, index) => (
              <section
                className="ps-story-section ps-reveal"
                id={section.id}
                key={section.id}
              >
                <span className="ps-section-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
            <div className="ps-takeaway ps-reveal">
              <Sparkle size={32} weight="fill" aria-hidden="true" />
              <p>{project.takeaway}</p>
            </div>
            <section className="ps-stack ps-reveal" id="project-stack">
              <p className="ps-section-label">WHAT’S UNDERNEATH</p>
              <h2>Tools behind the experience.</h2>
              <ul>
                {project.stack.map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </section>
          </article>
        </div>

        {project.video && (
          <section
            className="ps-film ps-reveal"
            aria-labelledby="ps-film-title"
          >
            <div>
              <p className="ps-section-label">THE SHORT VERSION</p>
              <h2 id="ps-film-title">{project.video.title}</h2>
              <p>
                {project.video.duration}. A closer look at the app in motion.
              </p>
            </div>
            <video
              ref={video}
              controls
              playsInline
              preload="none"
              poster={project.video.poster}
              aria-label={`${project.name} product film`}
            >
              <source src={project.video.src} type="video/mp4" />
              Your browser cannot play this video.{" "}
              <a href={project.video.src}>Open the product explainer</a>.
            </video>
          </section>
        )}

        <section className="ps-next ps-reveal" aria-labelledby="ps-next-title">
          <div>
            <p className="ps-section-label">KEEP THE CURIOSITY GOING</p>
            <h2 id="ps-next-title">Next up.</h2>
          </div>
          <a href={`/work/${next.id}`}>
            <span>{next.category}</span>
            <strong>{next.name}</strong>
            <p>{next.headline}</p>
            <ArrowRight size={32} aria-hidden="true" />
          </a>
        </section>
        <footer className="ps-footer">
          <p>Got a “could we make this?”</p>
          <a
            href="/?enquire=1#contact"
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              startContact();
            }}
          >
            Let’s make something useful <ArrowUpRight size={22} />
          </a>
          <span>MARK RENZO / APPS, TOOLS &amp; AUTOMATIONS</span>
        </footer>
      </div>
      {guideElement}
    </main>
  );
}

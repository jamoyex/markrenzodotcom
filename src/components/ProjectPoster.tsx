"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react";
import gsap from "gsap";
import type { ProjectId } from "@/lib/project-ids";
import "./project-poster.css";

const asset = "/images/projects/";
const names: Record<ProjectId, string> = {
  courtfolio: "Courtfolio",
  hellomarky: "Hello Marky",
  "pickle-pals": "PicklePals",
  "selfhelp-ai": "SelfHelp AI",
  "parking-buddy": "Parking Buddy",
  "next-move-asia": "Next Move Asia",
};

function Art({
  src,
  width,
  height,
  className = "",
}: {
  src: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <Image
      className={className}
      src={`${asset}${src}`}
      width={width}
      height={height}
      alt=""
      sizes="(max-width: 680px) 70vw, 40vw"
      quality={90}
      draggable={false}
    />
  );
}

function CourtfolioPoster() {
  return (
    <>
      <div className="pp-court-lines" aria-hidden="true" />
      <div className="pp-court-brand" data-poster-enter>
        <Art src="brand-courtfolio.svg" width={610} height={132} />
      </div>
      <div className="pp-court-type" data-poster-enter>
        Your game.
        <br />
        <em>Your story.</em>
      </div>
      <div
        className="pp-court-sculpture"
        data-poster-enter
        data-poster-parallax="1.4"
      >
        <Art src="courtfolio-paddle-sculpture.png" width={1024} height={1536} />
      </div>
      <div
        className="pp-court-screen"
        data-poster-enter
        data-poster-parallax="-0.6"
      >
        <Art src="courtfolio/profile.png" width={1320} height={2868} />
      </div>
    </>
  );
}

function HelloPoster() {
  return (
    <>
      <div className="pp-hello-orbit" aria-hidden="true" />
      <div className="pp-hello-brand" data-poster-enter>
        <Art src="brand-hello-marky-dark.svg" width={940} height={150} />
      </div>
      <div className="pp-hello-type" data-poster-enter>
        A better
        <br />
        <em>hello.</em>
      </div>
      <div
        className="pp-hello-mascot"
        data-poster-enter
        data-poster-parallax="1.2"
      >
        <Art src="brand-hello-marky-symbol.svg" width={120} height={120} />
      </div>
      <div
        className="pp-hello-screen"
        data-poster-enter
        data-poster-parallax="-0.5"
      >
        <Art src="hello-marky-desktop.png" width={1440} height={900} />
      </div>
      <div
        className="pp-hello-sticker"
        data-poster-enter
        data-poster-parallax="1.8"
      >
        <Art src="hello-marky-on-it.svg" width={430} height={170} />
      </div>
    </>
  );
}

function PicklePoster() {
  return (
    <>
      <div className="pp-pickle-band" aria-hidden="true" />
      <div className="pp-pickle-brand" data-poster-enter>
        <Art src="brand-picklepals.png" width={1080} height={540} />
      </div>
      <div className="pp-pickle-type" data-poster-enter>
        More play.
        <br />
        <em>More pals.</em>
      </div>
      <div className="pp-pickle-stamp" data-poster-enter>
        YOUR CLUB.
        <br />
        YOUR COURT.
        <br />
        YOUR CREW.
      </div>
      <div
        className="pp-pickle-screen"
        data-poster-enter
        data-poster-parallax="-0.7"
      >
        <Art
          src="pickle-pals/app-booking-mobile.jpg"
          width={390}
          height={844}
        />
      </div>
      <div
        className="pp-pickle-crew"
        data-poster-enter
        data-poster-parallax="1.2"
      >
        <Art src="pickle-pals-open-play-crew.png" width={446} height={349} />
      </div>
      <div className="pp-pickle-footer">
        BOOK A COURT. MAKE IT A REGULAR THING.
      </div>
    </>
  );
}

function SelfHelpPoster() {
  return (
    <>
      <div className="pp-self-grid" aria-hidden="true" />
      <div className="pp-self-brand" data-poster-enter>
        <Art src="brand-selfhelp.svg" width={64} height={64} />
        <span>Self Help AI</span>
      </div>
      <div className="pp-self-type" data-poster-enter>
        A little help.
        <br />
        <em>Right here.</em>
      </div>
      <div className="pp-self-ring" aria-hidden="true" />
      <div
        className="pp-self-screen"
        data-poster-enter
        data-poster-parallax="-0.5"
      >
        <Art src="selfhelp-app-desktop.jpg" width={1440} height={900} />
      </div>
      <div
        className="pp-self-knowledge"
        data-poster-enter
        data-poster-parallax="0.8"
      >
        <Art src="selfhelp-app-knowledge.jpg" width={1440} height={900} />
      </div>
    </>
  );
}

function ParkingPoster() {
  return (
    <>
      <div className="pp-parking-road" aria-hidden="true">
        <span />
      </div>
      <div className="pp-parking-brand" data-poster-enter>
        <Art src="brand-parking-buddy-current.svg" width={64} height={64} />
        <span>parkingbuddy</span>
      </div>
      <div className="pp-parking-type" data-poster-enter>
        Less circling.
        <br />
        <em>More living.</em>
      </div>
      <div
        className="pp-parking-car"
        data-poster-enter
        data-poster-parallax="1.3"
      >
        <Art src="parking-buddy-car.webp" width={440} height={660} />
      </div>
      <div
        className="pp-parking-pass"
        data-poster-enter
        data-poster-parallax="-0.8"
      >
        <Art src="parking-buddy-app-pass.png" width={390} height={1200} />
      </div>
      <div className="pp-parking-ticket" data-poster-enter>
        <b>
          GOOD DAYS
          <br />
          PARK HERE.
        </b>
        <span>FIND · BOOK · ARRIVE</span>
      </div>
    </>
  );
}

function NextMovePoster() {
  return (
    <>
      <div className="pp-next-route" aria-hidden="true" />
      <div className="pp-next-brand" data-poster-enter>
        <Art src="brand-next-move-asia.svg" width={1080} height={162} />
      </div>
      <div className="pp-next-type" data-poster-enter>
        Go beyond
        <br />
        <em>the classroom.</em>
      </div>
      <div
        className="pp-next-compass"
        data-poster-enter
        data-poster-parallax="1.4"
      >
        <Art src="next-move-compass.webp" width={900} height={1350} />
      </div>
      <div
        className="pp-next-screen"
        data-poster-enter
        data-poster-parallax="-0.6"
      >
        <Art src="next-move-desktop.png" width={1440} height={900} />
      </div>
      <div className="pp-next-asterisk" aria-hidden="true">
        ✳
      </div>
      <div className="pp-next-footer">
        FIND YOUR PEOPLE. FIND YOUR NEXT MOVE.
      </div>
    </>
  );
}

const posters = {
  courtfolio: CourtfolioPoster,
  hellomarky: HelloPoster,
  "pickle-pals": PicklePoster,
  "selfhelp-ai": SelfHelpPoster,
  "parking-buddy": ParkingPoster,
  "next-move-asia": NextMovePoster,
};

export default function ProjectPoster({
  projectId,
  onOpen,
}: {
  projectId: ProjectId;
  onOpen: (id: ProjectId) => void;
}) {
  const root = useRef<HTMLAnchorElement>(null);
  const Poster = posters[projectId];

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const entries = element.querySelectorAll("[data-poster-enter]");
      const reveal = gsap.fromTo(
        entries,
        { y: 38, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.075,
          ease: "power3.out",
          paused: true,
        },
      );
      // The observer also respects the horizontal showcase's clipping window.
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) reveal.play();
        },
        { threshold: 0.2 },
      );
      observer.observe(element);

      const planes = Array.from(
        element.querySelectorAll<HTMLElement>("[data-poster-parallax]"),
      );
      const movement = planes.map((plane) => ({
        weight: Number(plane.dataset.posterParallax),
        x: gsap.quickTo(plane, "x", { duration: 0.8, ease: "power3.out" }),
        y: gsap.quickTo(plane, "y", { duration: 0.8, ease: "power3.out" }),
      }));
      const move = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || reveal.progress() < 1) return;
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        movement.forEach((plane) => {
          plane.x(x * 17 * plane.weight);
          plane.y(y * 13 * plane.weight);
        });
      };
      const leave = () =>
        movement.forEach((plane) => {
          plane.x(0);
          plane.y(0);
        });
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      return () => {
        observer.disconnect();
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerleave", leave);
      };
    });
    return () => media.revert();
  }, []);

  return (
    <a
      ref={root}
      className={`project-poster pp-${projectId}`}
      href={`/work/${projectId}`}
      aria-label={`Explore ${names[projectId]}: product screens and the story behind the build`}
      onClick={(event) => {
        if (
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          onOpen(projectId);
        }
      }}
    >
      <div className="pp-composition" aria-hidden="true">
        <Poster />
      </div>
      <span className="pp-open">
        <span>Explore the project</span>
        <ArrowUpRight size={22} />
      </span>
    </a>
  );
}

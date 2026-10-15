"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ArrowLeft, ArrowRight, CornersOut, X } from "@phosphor-icons/react";
import "./project-demo.css";

type Screen = {
  src: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  alt: string;
  device: "phone" | "desktop" | "laptop" | "tablet";
  category?: string;
  layout?: "wide" | "half";
};
type ProjectScreens = {
  name: string;
  logo: string;
  hero: number[];
  features: number[];
  screens: Screen[];
};
const projects: Record<string, ProjectScreens> = {
  courtfolio: {
    name: "Courtfolio",
    logo: "/images/projects/brand-courtfolio.svg",
    hero: [1, 2],
    features: [0, 3],
    screens: [
      {
        src: "/images/projects/courtfolio-landing.png",
        width: 1512,
        height: 1038,
        device: "desktop",
        title: "The first impression",
        caption:
          "The Courtfolio website brings the same playful identity to the story around the app.",
        alt: "Courtfolio website landing page",
      },
      {
        src: "/images/projects/courtfolio/profile.png",
        width: 1320,
        height: 2868,
        device: "phone",
        title: "Your pickleball story",
        caption:
          "A player profile brings check-ins, court crowns, and badges together.",
        alt: "Courtfolio iPhone player profile with court crowns and badges",
      },
      {
        src: "/images/projects/courtfolio/courts.png",
        width: 1320,
        height: 2868,
        device: "phone",
        title: "Start with a check-in",
        caption: "Choose the court and game, then save the moment.",
        alt: "Courtfolio iPhone check-in composer with court, game type, notes and privacy options",
      },
      {
        src: "/images/projects/courtfolio/check-in.png",
        width: 1320,
        height: 2868,
        device: "phone",
        title: "Finish the session",
        caption:
          "Keep the duration and spend, with room for the details that matter.",
        alt: "Courtfolio iPhone finish-session screen with duration and spend options",
      },
    ],
  },
  hellomarky: {
    name: "Hello Marky",
    logo: "/images/projects/brand-hello-marky-dark.svg",
    hero: [0],
    features: [1, 2],
    screens: [
      {
        src: "/images/projects/hello-marky-app-inbox.png",
        width: 1512,
        height: 707,
        device: "desktop",
        title: "Every conversation, together",
        caption:
          "The inbox keeps the customer, their conversation, and the next step in view.",
        alt: "Hello Marky application inbox with conversation list, customer messages and contact context",
      },
      {
        src: "/images/projects/hello-marky-app-settings.png",
        width: 1512,
        height: 707,
        device: "desktop",
        title: "Give the agent its context",
        caption:
          "Instructions and AI settings shape how the assistant responds.",
        alt: "Hello Marky application AI Settings screen",
      },
      {
        src: "/images/projects/hello-marky-home.png",
        width: 1512,
        height: 707,
        device: "desktop",
        title: "A calm first impression",
        caption:
          "The product website carries the same useful, approachable character as the app.",
        alt: "Hello Marky product website design",
      },
    ],
  },
  "pickle-pals": {
    name: "PicklePals",
    logo: "/images/projects/brand-picklepals.png",
    hero: [0],
    features: [1, 2],
    screens: [
      {
        src: "/images/projects/pickle-pals/schedule-page.png",
        width: 1280,
        height: 580,
        device: "laptop",
        title: "Make time to play",
        caption:
          "The club website connects court bookings, open play, and membership.",
        alt: "PicklePals website court schedule and open-play page",
      },
      {
        src: "/images/projects/pickle-pals/membership-page.png",
        width: 1280,
        height: 650,
        device: "desktop",
        title: "Find your place in the club",
        caption:
          "A dedicated membership page introduces the experience and benefits of joining.",
        alt: "PicklePals club membership website page",
      },
      {
        src: "/images/projects/pickle-pals/member-tools.png",
        width: 1280,
        height: 790,
        device: "desktop",
        title: "The club, in your pocket",
        caption:
          "Membership, QR access, credits, and vouchers come together in one account.",
        alt: "PicklePals website showing the club's member tools",
      },
    ],
  },
  "selfhelp-ai": {
    name: "SelfHelp AI",
    logo: "/images/projects/brand-selfhelp.svg",
    hero: [0],
    features: [1, 2],
    screens: [
      {
        src: "/images/projects/selfhelp-ai/website-hero.png",
        width: 1280,
        height: 1000,
        device: "tablet",
        title: "Your portal has answers",
        caption:
          "The product website introduces an AI companion built around the course and its members.",
        alt: "SelfHelp AI website introducing the course and client-portal assistant",
      },
      {
        src: "/images/projects/selfhelp-ai/website-course-learning.png",
        width: 1280,
        height: 623,
        device: "desktop",
        title: "Context makes the difference",
        caption:
          "Lessons, attachments, and transcripts become useful sources of help.",
        alt: "SelfHelp AI website explaining how it learns course content",
      },
      {
        src: "/images/projects/selfhelp-ai/website-human-support.png",
        width: 1280,
        height: 617,
        device: "desktop",
        title: "A human when it matters",
        caption:
          "Questions reach the team, and useful answers can be reviewed for reuse.",
        alt: "SelfHelp AI website showing the question, team reply and published-answer workflow",
      },
    ],
  },
  "parking-buddy": {
    name: "Parking Buddy",
    logo: "/images/projects/brand-parking-buddy-current.svg",
    hero: [0],
    features: [1, 2, 3],
    screens: [
      {
        src: "/images/projects/parking-buddy-landing.png",
        width: 1512,
        height: 707,
        device: "laptop",
        title: "A space for your plans",
        caption:
          "The Parking Buddy website introduces parking for drivers and a way for owners to share their spaces.",
        alt: "Parking Buddy website landing page",
      },
      {
        src: "/images/projects/parking-buddy-app-listing.png",
        width: 390,
        height: 1400,
        device: "phone",
        title: "A spot that works for you",
        caption: "The space, its price, and the booking details stay together.",
        alt: "Parking Buddy mobile application showing a parking space and booking details",
      },
      {
        src: "/images/projects/parking-buddy-app-payment.png",
        width: 390,
        height: 1400,
        device: "phone",
        title: "A clear next step",
        caption:
          "Drivers pay the owner directly and upload their receipt for review.",
        alt: "Parking Buddy mobile application with payment instructions and receipt upload",
      },
      {
        src: "/images/projects/parking-buddy-app-pass.png",
        width: 390,
        height: 1200,
        device: "phone",
        title: "Ready when you arrive",
        caption:
          "A confirmed stay keeps the parking pass and arrival instructions close at hand.",
        alt: "Parking Buddy mobile application showing a confirmed stay and QR parking pass",
      },
    ],
  },
  "next-move-asia": {
    name: "Next Move Asia",
    logo: "/images/projects/brand-next-move-asia-white.svg",
    hero: [0],
    features: [1, 2],
    screens: [
      {
        src: "/images/projects/next-move-home.png",
        width: 1512,
        height: 707,
        device: "laptop",
        title: "Learning beyond the classroom",
        caption:
          "The website introduces practical programs and international immersions with a bold, warm identity.",
        alt: "Next Move Asia website home page",
      },
      {
        src: "/images/projects/next-move-academy.png",
        width: 1512,
        height: 707,
        device: "desktop",
        title: "Life skills, made real",
        caption: "The Academy page brings practical workshops into focus.",
        alt: "Next Move Asia Academy page showing the complete Life skills made real heading and workshop image",
      },
      {
        src: "/images/projects/next-move-international.png",
        width: 1512,
        height: 707,
        device: "desktop",
        title: "Take learning further",
        caption:
          "International immersion programs get their own distinct chapter in the site.",
        alt: "Next Move Asia International immersion website page",
      },
    ],
  },
};

const projectGalleries: Record<string, Screen[]> = {
  courtfolio: [
    { ...projects.courtfolio.screens[0], category: "Website", layout: "wide" },
    {
      ...projects.courtfolio.screens[1],
      category: "Player profile",
      layout: "half",
    },
    {
      ...projects.courtfolio.screens[2],
      category: "Check-ins",
      layout: "half",
    },
    {
      ...projects.courtfolio.screens[3],
      category: "Session journal",
      layout: "half",
    },
    {
      src: "/images/projects/courtfolio/backtrack.png",
      width: 1320,
      height: 2868,
      device: "phone",
      title: "Bring old games along",
      caption:
        "Photo memories can become check-ins, with a court, date, game type, and visibility to review.",
      alt: "Courtfolio backtrack check-ins screen with a suggested session from a photo",
      category: "Photo memories",
      layout: "half",
    },
    {
      src: "/images/projects/courtfolio/badges.png",
      width: 1320,
      height: 2868,
      device: "phone",
      title: "A little reward for showing up",
      caption:
        "Court visits and playing milestones become a badge collection that grows with you.",
      alt: "Courtfolio unlocked Pickle Passport achievement and badge case",
      category: "Achievements",
      layout: "half",
    },
    {
      src: "/images/projects/courtfolio/community.png",
      width: 1320,
      height: 2868,
      device: "phone",
      title: "Find your next rally",
      caption:
        "Search for players, courts, and cities, then follow the people you want to keep up with.",
      alt: "Courtfolio search screen for players courts and cities",
      category: "Community",
      layout: "half",
    },
  ],
  hellomarky: [
    {
      src: "/images/projects/hello-marky-desktop.png",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "Every conversation, together",
      caption:
        "Messages and customer context sit side by side, with a clear handoff when a person needs to step in.",
      alt: "Hello Marky application inbox with conversation list messages and customer context",
      category: "Conversations",
      layout: "wide",
    },
    {
      src: "/images/projects/hello-marky-app-ai-settings.png",
      width: 1440,
      height: 820,
      device: "desktop",
      title: "Give the agent a direction",
      caption:
        "Instructions and capabilities shape what the assistant can say and do.",
      alt: "Hello Marky AI Settings screen with bot instructions and capabilities",
      category: "Agent setup",
      layout: "half",
    },
    {
      src: "/images/projects/hello-marky-app-knowledge.png",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "Build on what the business knows",
      caption:
        "Files, links, text, and reviewed answers give the assistant its source material.",
      alt: "Hello Marky knowledge workspace with sources and question-and-answer library",
      category: "Knowledge",
      layout: "half",
    },
    {
      src: "/images/projects/hello-marky-app-tools.png",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "Useful beyond the reply",
      caption:
        "Connected tools give the agent abilities it can use inside a conversation.",
      alt: "Hello Marky tools workspace with a connected MCP service and available abilities",
      category: "Connected tools",
      layout: "wide",
    },
    {
      src: "/images/projects/hello-marky-app-channels.png",
      width: 1440,
      height: 820,
      device: "desktop",
      title: "Meet people where they message",
      caption:
        "Messenger and Instagram connections bring conversations into the same workspace.",
      alt: "Hello Marky channel connections for Messenger and Instagram",
      category: "Channels",
      layout: "half",
    },
    {
      ...projects.hellomarky.screens[2],
      category: "Product website",
      layout: "half",
    },
  ],
  "pickle-pals": [
    {
      src: "/images/projects/pickle-pals/app-dashboard-desktop.jpg",
      width: 1440,
      height: 1877,
      device: "desktop",
      title: "A home for your club life",
      caption:
        "The member dashboard brings court time, open play, credits, and quick actions together.",
      alt: "PicklePals member dashboard with activity summary credit balance and booking actions",
      category: "Member experience",
      layout: "wide",
    },
    {
      src: "/images/projects/pickle-pals/app-bookings-desktop.jpg",
      width: 1440,
      height: 1000,
      device: "desktop",
      title: "Keep your court time in view",
      caption:
        "Upcoming and completed bookings have a place of their own, with dates, courts, and status easy to find.",
      alt: "PicklePals member booking history with confirmed and completed court reservations",
      category: "Court bookings",
      layout: "half",
    },
    {
      src: "/images/projects/pickle-pals/app-credits-desktop.jpg",
      width: 1440,
      height: 1000,
      device: "desktop",
      title: "Ready for the next game",
      caption:
        "Members can review their balance and choose how to add credits for club activities.",
      alt: "PicklePals credit top-up page with available payment methods",
      category: "Member credits",
      layout: "half",
    },
    {
      src: "/images/projects/pickle-pals/app-events-desktop.jpg",
      width: 1440,
      height: 1787,
      device: "desktop",
      title: "Give the community a date",
      caption:
        "Club events pair the calendar with registration details and clear event status.",
      alt: "PicklePals club events list with registration statuses and calendar",
      category: "Community events",
      layout: "wide",
    },
    {
      src: "/images/projects/pickle-pals/app-booking-mobile.jpg",
      width: 390,
      height: 844,
      device: "phone",
      title: "Book from wherever you are",
      caption:
        "The mobile booking form keeps court and time selection focused.",
      alt: "PicklePals mobile Book a Court form with court and start and end time fields",
      category: "Mobile booking",
      layout: "half",
    },
    {
      src: "/images/projects/pickle-pals/app-dashboard-mobile.jpg",
      width: 390,
      height: 844,
      device: "phone",
      title: "The club comes with you",
      caption:
        "The same member experience adapts to a phone, keeping the next action close.",
      alt: "PicklePals responsive mobile member dashboard",
      category: "Mobile dashboard",
      layout: "half",
    },
    {
      src: "/images/projects/pickle-pals/app-open-play-desktop.jpg",
      width: 1440,
      height: 4228,
      device: "desktop",
      title: "More ways to get a game",
      caption:
        "Daily open play brings the member’s QR pass, credits, and playing options into view.",
      alt: "PicklePals daily open-play page with the member QR code and credit balance",
      category: "Open play",
      layout: "wide",
    },
    {
      src: "/images/projects/pickle-pals/app-events-admin-desktop.jpg",
      width: 1440,
      height: 1000,
      device: "desktop",
      title: "Keep the club running",
      caption:
        "A separate operations workspace gives staff a calendar for managing events.",
      alt: "PicklePals staff event management calendar",
      category: "Club operations",
      layout: "wide",
    },
  ],
  "selfhelp-ai": [
    {
      src: "/images/projects/selfhelp-app-desktop.jpg",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "See where members need a hand",
      caption:
        "An overview brings questions, conversations, and requests for human help into one place.",
      alt: "SelfHelp AI overview with message activity, frequent questions and conversations needing a human",
      category: "Assistant overview",
      layout: "wide",
    },
    {
      src: "/images/projects/selfhelp-app-knowledge.jpg",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "Give every answer a foundation",
      caption:
        "Shared documents and page-specific knowledge keep answers close to the material members are learning.",
      alt: "SelfHelp AI knowledge workspace with account documents and page-specific sources",
      category: "Knowledge",
      layout: "half",
    },
    {
      src: "/images/projects/selfhelp-app-pages.jpg",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "A little context for every lesson",
      caption:
        "Course pages are grouped with their setup state, ready for a welcome message and guidance of their own.",
      alt: "SelfHelp AI course pages grouped by course with configured and needs-setup states",
      category: "Lesson context",
      layout: "half",
    },
    {
      src: "/images/projects/selfhelp-app-course.jpg",
      width: 1440,
      height: 2094,
      device: "desktop",
      title: "Shape the help around the course",
      caption:
        "Welcome messages, quick replies, instructions, and source documents can be tailored to each course.",
      alt: "SelfHelp AI course configuration with welcome message, quick replies, instructions, lessons and documents",
      category: "Course configuration",
      layout: "wide",
    },
    {
      src: "/images/projects/selfhelp-app-inbox.jpg",
      width: 1440,
      height: 900,
      device: "desktop",
      title: "Keep a human in the conversation",
      caption:
        "The team can answer questions the assistant could not resolve, then choose which answers to reuse.",
      alt: "SelfHelp AI inbox of unanswered questions with reply and publication controls",
      category: "Human support",
      layout: "half",
    },
    {
      ...projects["selfhelp-ai"].screens[0],
      category: "Product website",
      layout: "half",
    },
  ],
  "parking-buddy": [
    {
      src: "/images/projects/parking-buddy-owner-calendar.png",
      width: 1440,
      height: 1674,
      device: "desktop",
      title: "Know what the day looks like",
      caption:
        "Owners can see availability, the day’s schedule, and the next guest in one workspace.",
      alt: "Parking Buddy owner availability calendar with day schedule and upcoming guest",
      category: "Owner workspace",
      layout: "wide",
    },
    {
      src: "/images/projects/parking-buddy-owner-listing.png",
      width: 1440,
      height: 1114,
      device: "desktop",
      title: "Make the space easy to understand",
      caption:
        "Space details, photos, rates, and availability explain what a driver can expect.",
      alt: "Parking Buddy owner space listing settings",
      category: "Space management",
      layout: "half",
    },
    {
      src: "/images/projects/parking-buddy-owner-pricing.png",
      width: 1440,
      height: 1156,
      device: "desktop",
      title: "Set the terms of a stay",
      caption:
        "Hourly, package, and overnight options give owners control over their parking offer.",
      alt: "Parking Buddy owner pricing settings with hourly package and overnight options",
      category: "Pricing and rules",
      layout: "half",
    },
    {
      src: "/images/projects/parking-buddy-owner-bookings.png",
      width: 1440,
      height: 826,
      device: "desktop",
      title: "Keep reservations moving",
      caption:
        "Payment-review requests and reservations stay visible to the owner.",
      alt: "Parking Buddy owner reservations and payment review workspace",
      category: "Reservation management",
      layout: "wide",
    },
    {
      ...projects["parking-buddy"].screens[1],
      category: "Driver experience",
      layout: "half",
    },
    {
      ...projects["parking-buddy"].screens[2],
      category: "Payment receipt",
      layout: "half",
    },
    {
      ...projects["parking-buddy"].screens[3],
      category: "Arrival",
      layout: "half",
    },
  ],
};
const heroAssets: Record<
  string,
  {
    desktop: string;
    mobile: string;
    mobileTitle: string;
    mobileAlt: string;
    mobileCaption: string;
  }
> = {
  courtfolio: {
    desktop: "/images/projects/courtfolio-desktop.jpg",
    mobile: "/images/projects/courtfolio/profile.png",
    mobileTitle: "Your pickleball story",
    mobileAlt: "Courtfolio iPhone player profile with court crowns and badges",
    mobileCaption:
      "A player profile brings check-ins, court crowns, and badges together.",
  },
  hellomarky: {
    desktop: "/images/projects/hello-marky-desktop.png",
    mobile: "/images/projects/hello-marky-mobile.png",
    mobileTitle: "Hello Marky on the move",
    mobileAlt: "Hello Marky mobile inbox showing a customer conversation",
    mobileCaption:
      "The conversation and its next step stay close, even on a smaller screen.",
  },
  "pickle-pals": {
    desktop: "/images/projects/pickle-pals-desktop.jpg",
    mobile: "/images/projects/pickle-pals-mobile.jpg",
    mobileTitle: "Make time to play",
    mobileAlt: "PicklePals court schedule website on a mobile screen",
    mobileCaption:
      "The club website brings court schedules and open play to smaller screens.",
  },
  "selfhelp-ai": {
    desktop: "/images/projects/selfhelp-app-desktop.jpg",
    mobile: "/images/projects/selfhelp-app-mobile.jpg",
    mobileTitle: "Keep help close",
    mobileAlt: "SelfHelp AI responsive mobile assistant overview",
    mobileCaption:
      "The assistant overview keeps conversations and questions close on a smaller screen.",
  },
  "parking-buddy": {
    desktop: "/images/projects/parking-buddy-desktop.png",
    mobile: "/images/projects/parking-buddy-mobile.png",
    mobileTitle: "Your pass, ready to go",
    mobileAlt:
      "Parking Buddy mobile application showing a confirmed stay and QR parking pass",
    mobileCaption:
      "A confirmed stay keeps the parking pass ready when you arrive.",
  },
  "next-move-asia": {
    desktop: "/images/projects/next-move-desktop.png",
    mobile: "/images/projects/next-move-mobile.png",
    mobileTitle: "A world of possibility",
    mobileAlt: "Next Move Asia responsive mobile website",
    mobileCaption:
      "The experience-led education website adapts its bold identity for a smaller screen.",
  },
};
const exhibits: Record<string, ProjectScreens> = Object.fromEntries(
  Object.entries(projects).map(([id, project]) => {
    const assets = heroAssets[id];
    const desktop: Screen = {
      ...project.screens[0],
      src: assets.desktop,
      width: 1440,
      height: 900,
      device: "laptop",
    };
    const mobile: Screen = {
      src: assets.mobile,
      width: id === "courtfolio" ? 1320 : 390,
      height: id === "courtfolio" ? 2868 : 844,
      device: "phone",
      title: assets.mobileTitle,
      caption: assets.mobileCaption,
      alt: assets.mobileAlt,
    };
    const gallery =
      projectGalleries[id] ||
      project.features.map((index) => project.screens[index]);
    const screens = Array.from(
      new Map(
        [desktop, mobile, ...gallery].map((screen) => [screen.src, screen]),
      ).values(),
    );
    return [
      id,
      {
        ...project,
        screens,
        hero: [
          screens.findIndex((screen) => screen.src === desktop.src),
          screens.findIndex((screen) => screen.src === mobile.src),
        ],
        features: gallery.map((item) =>
          screens.findIndex((screen) => screen.src === item.src),
        ),
      },
    ];
  }),
);

function ScreenImage({
  screen,
  priority = false,
  className = "",
  sizes = "(max-width: 700px) 90vw, 1100px",
}: {
  screen: Screen;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      className={className}
      src={screen.src}
      alt={screen.alt}
      width={screen.width}
      height={screen.height}
      sizes={sizes}
      quality={90}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

function ScreenLightbox({
  project,
  index,
  onIndex,
  onClose,
}: {
  project: ProjectScreens;
  index: number;
  onIndex: (next: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const screen = project.screens[index];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    close.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  const move = (direction: number) =>
    onIndex(
      (index + direction + project.screens.length) % project.screens.length,
    );
  return (
    <dialog
      ref={dialog}
      className="product-image-lightbox"
      aria-labelledby={labelId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <header>
        <div>
          <small>{project.name}</small>
          <h3 id={labelId}>{screen.title}</h3>
        </div>
        <a
          href={screen.src}
          target="_blank"
          rel="noopener noreferrer"
          className="product-image-original"
          aria-label="Open full-size image in a new tab"
        >
          Open full size <span aria-hidden="true">↗</span>
        </a>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label="Close image"
        >
          <X />
        </button>
      </header>
      <div className="product-image-full">
        <img
          src={screen.src}
          alt={screen.alt}
          width={screen.width}
          height={screen.height}
        />
      </div>
      <footer>
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="Previous image"
        >
          <ArrowLeft />
        </button>
        <p>{screen.caption}</p>
        <button type="button" onClick={() => move(1)} aria-label="Next image">
          <ArrowRight />
        </button>
      </footer>
    </dialog>
  );
}

/** An exhibit of the actual product, with its own brand and device proportions. */
export default function ProjectDemo({
  projectId,
  compact = false,
}: {
  projectId: string;
  compact?: boolean;
}) {
  const project = exhibits[projectId] || exhibits.courtfolio;
  const [expanded, setExpanded] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let context: gsap.Context | undefined;
    const reveal = () => {
      context?.revert();
      if (media.matches) return;
      context = gsap.context(() => {
        const screens = element.querySelectorAll(".ph-mockup");
        if (screens.length)
          gsap.fromTo(
            screens,
            { y: 22, opacity: 0.2 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.09,
              ease: "power3.out",
              clearProps: "transform,opacity",
            },
          );
      }, element);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(element);
    const reduceChanged = () => {
      if (media.matches) context?.revert();
    };
    media.addEventListener("change", reduceChanged);
    return () => {
      observer.disconnect();
      context?.revert();
      media.removeEventListener("change", reduceChanged);
    };
  }, [projectId]);
  return (
    <section
      ref={root}
      className={`product-hero ph-${projectId} ${compact ? "ph-compact" : ""}`}
      aria-label={`${project.name} product design`}
    >
      <div className="ph-brand">
        <img src={project.logo} alt={project.name} />
        {projectId === "selfhelp-ai" && <span>SelfHelp AI</span>}
        {projectId === "parking-buddy" && <span>parkingbuddy</span>}
      </div>
      <div className="ph-canvas">
        {project.hero.map((screenIndex, position) => {
          const screen = project.screens[screenIndex];
          const device = position === 0 ? "laptop" : "phone";
          return (
            <div
              key={screen.src}
              className={`ph-mockup ph-mockup-${device} ph-position-${position}`}
            >
              <button
                type="button"
                className={`ph-device ph-${device}`}
                onClick={(event) => {
                  event.currentTarget.focus();
                  setExpanded(screenIndex);
                }}
                aria-label={`View full image: ${screen.alt}`}
              >
                <span className="ph-screen" style={{ aspectRatio: `${screen.width} / ${screen.height}` }}>
                  <ScreenImage
                    screen={screen}
                    priority={!compact}
                    sizes={
                      device === "phone"
                        ? "(max-width: 700px) 220px, 300px"
                        : "(max-width: 700px) 90vw, 1100px"
                    }
                  />
                </span>
                <span className="ph-zoom">
                  <CornersOut aria-hidden="true" />
                </span>
              </button>
              {device === "laptop" && (
                <span className="ph-laptop-base" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      {expanded !== null && (
        <ScreenLightbox
          project={project}
          index={expanded}
          onIndex={setExpanded}
          onClose={() => setExpanded(null)}
        />
      )}
    </section>
  );
}

export function ProjectFeatureGallery({ projectId }: { projectId: string }) {
  const project = exhibits[projectId] || exhibits.courtfolio;
  const [expanded, setExpanded] = useState<number | null>(null);
  if (!project.features.length) return null;
  return (
    <div
      className={`project-feature-gallery pfg-${projectId} ${project.features.length > 3 ? "pfg-expanded" : ""}`}
    >
      {project.features.map((screenIndex, featureIndex) => {
        const screen = project.screens[screenIndex];
        return (
          <figure
            key={screen.src}
            className={`pfg-figure pfg-${screen.device} pfg-${screen.layout || (featureIndex % 3 === 0 ? "wide" : "half")} ${screen.device !== "phone" && screen.height > screen.width ? "pfg-tall" : ""} ${screen.device !== "phone" && screen.height / screen.width > 2 ? "pfg-long" : ""}`}
            style={{ "--screen-ratio": screen.width / screen.height } as CSSProperties}
          >
            <button
              type="button"
              className="pfg-image"
              onClick={(event) => {
                event.currentTarget.focus();
                setExpanded(screenIndex);
              }}
              aria-label={`View full image: ${screen.alt}`}
            >
              <ScreenImage
                screen={screen}
                sizes={
                  screen.device === "phone"
                    ? "(max-width: 700px) 80vw, 380px"
                    : "(max-width: 700px) 90vw, 1100px"
                }
              />
              <span className="ph-zoom">
                <CornersOut aria-hidden="true" />
              </span>
            </button>
            <figcaption>
              {screen.category && (
                <span className="pfg-category">{screen.category}</span>
              )}
              <h3>{screen.title}</h3>
              <p>{screen.caption}</p>
            </figcaption>
          </figure>
        );
      })}
      {expanded !== null && (
        <ScreenLightbox
          project={project}
          index={expanded}
          onIndex={setExpanded}
          onClose={() => setExpanded(null)}
        />
      )}
    </div>
  );
}

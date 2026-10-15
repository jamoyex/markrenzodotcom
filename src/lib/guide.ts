/**
 * Local, deterministic guide for the first portfolio draft.
 * Personal facts are sourced from docs/asset-notes/existing-portfolio-assets.md and Courtfolio's
 * verified App Store listing, linked in docs/AGENT-INTEGRATION.md.
 * The profile import is static public data, with no side effects or providers.
 * No provider, network request, executable code, or persistent storage is used.
 */
import { tools, workExperience } from "../data/profile";
import { findProjectIds, PROJECT_NAMES, type ProjectId } from "./project-ids";

export type SiteAction =
  | {
      type: "navigate";
      target:
        | "work"
        | "about"
        | "skills"
        | "experience"
        | "playground"
        | "contact"
        | "home";
    }
  | { type: "project"; id: ProjectId }
  | {
      type: "preview";
      kind: "dashboard" | "automation" | "website";
      title?: string;
    }
  | { type: "celebrate" }
  | { type: "reset-stickers" };

export type GuideReply = {
  reply: string;
  actions: SiteAction[];
  suggestions: string[];
  needsHuman?: boolean;
};

const STARTERS = ["Show me your work", "Build a dashboard", "Meet the human"];
const COMPANY_ALIASES: Record<string, string[]> = {
  work_botbuilders: ["botbuilders", "bot builders"],
  work_sge: ["sustainable growth experts", "sge"],
  work_afc: ["aussie founders club", "afc"],
  work_reactor: ["reactor school", "reactor"],
  work_mellow: ["mellow nutrition"],
  work_ciderbears: ["ciderbears", "cider bears"],
  work_riway: ["riway", "riway international"],
  work_bpi: ["bpi", "bank of the philippine islands"],
  work_samahan_lead: ["samahan", "samahan creative team"],
  work_digital_dream: ["digital dream", "digital dream studios"],
};
const PROJECTS: Record<ProjectId, { reply: string; suggestions: string[] }> = {
  courtfolio: {
    reply:
      "Here’s Courtfolio: a pickleball journal for discovering courts, checking in and saving your sessions and photos. You can share your activity, too. A place to keep the story of your time on court.",
    suggestions: [
      "Ask Mark about Courtfolio",
      "Show me HelloMarky",
      "Show all projects",
    ],
  },
  hellomarky: {
    reply:
      "Meet **Hello Marky**. Hello Marky Chat helps SMEs put AI chatbots on their websites for support, leads and visitor engagement. It brings business knowledge, connected tools and a shared inbox together, so a human can step into the conversation when needed.",
    suggestions: [
      "Show me PicklePals",
      "Preview an automation",
      "Contact Mark",
    ],
  },
  "pickle-pals": {
    reply:
      "Here’s PicklePals: a booking and membership web app for a pickleball club in General Santos. A useful little bridge between a club and its players.",
    suggestions: ["Show me HelloMarky", "Build a dashboard", "Contact Mark"],
  },
  "selfhelp-ai": {
    reply:
      "Meet **SelfHelp AI**: a course-support assistant for GoHighLevel client portals. It helps members find answers in their lessons and brings in a human when a question needs one. Let’s explore the story behind it.",
    suggestions: [
      "How does SelfHelp AI use course content?",
      "Show me Hello Marky",
      "Contact Mark",
    ],
  },
  "parking-buddy": {
    reply:
      "Meet **Parking Buddy**: a parking marketplace in the Philippines. Drivers can find a space, request a reservation and receive a parking pass once the owner confirms their payment. Owners manage their spaces, calendars and bookings. Let’s explore the product.",
    suggestions: [
      "Who is Parking Buddy for?",
      "How does Parking Buddy work?",
      "Show me Courtfolio",
    ],
  },
  "next-move-asia": {
    reply:
      "Here’s **Next Move Asia**, a website Mark built for an education business offering practical workshops and international immersions across Asia. The site helps schools, students and educators explore its programmes and make an enquiry.",
    suggestions: [
      "What did Mark build for Next Move Asia?",
      "How could Mark help with my website?",
      "Contact Mark",
    ],
  },
};

function normalize(message: string): string {
  return message
    .slice(0, 2000)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function projectIds(message: string): ProjectId[] {
  return findProjectIds(message);
}

function includesPhrase(message: string, phrase: string): boolean {
  return ` ${message} `.includes(` ${normalize(phrase)} `);
}

function showProject(id: ProjectId): GuideReply {
  return {
    reply: PROJECTS[id].reply,
    actions: [{ type: "project", id }],
    suggestions: [...PROJECTS[id].suggestions],
  };
}

function unknown(): GuideReply {
  return {
    reply: "I don’t know that yet.",
    actions: [{ type: "navigate", target: "contact" }],
    suggestions: ["Contact Mark", "Show me your work", "What can you build?"],
    needsHuman: true,
  };
}

function preview(kind: "dashboard" | "automation" | "website"): GuideReply {
  const descriptions = {
    dashboard:
      "Let’s sketch your dashboard. Review the idea below, make it yours, then press Make it happen.",
    automation:
      "Let’s sketch an automation demo. Describe the steps you have in mind below, then press Make it happen.",
    website:
      "Let’s give your website idea a first look. Add your brief below, then press Make it happen.",
  };
  return {
    reply: descriptions[kind],
    actions: [{ type: "preview", kind }],
    suggestions: [
      "Build a dashboard",
      "Preview an automation",
      "Let’s talk about my project",
    ],
  };
}

export function getGuideReply(
  message: string,
  context?: { lastProject?: string },
): GuideReply {
  const text = normalize(typeof message === "string" ? message : "");

  if (
    !text ||
    /^(hi|hey|hello|hiya|howdy)( there| mark| renzo| again)?$/.test(text)
  ) {
    return {
      reply:
        "Hi! I’m Mark’s AI guide. Ask about his work, take a look around, or try out an idea. Where shall we start?",
      actions: [],
      suggestions: [...STARTERS],
    };
  }

  if (
    /\b(reset|tidy|restore|rearrange)\b.*\bstickers?\b|\bput (everything|the stickers|them) back\b|\btidy up\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "A little desk reset. The stickers are heading back to their starting spots.",
      actions: [{ type: "reset-stickers" }],
      suggestions: ["Surprise me", "Show me your work", "Build a dashboard"],
    };
  }

  if (/\b(confetti|celebrate|celebration|party)\b|\bsurprise me\b/.test(text)) {
    return {
      reply: "A tiny celebration, just because. Now, what shall we make?",
      actions: [{ type: "celebrate" }],
      suggestions: [
        "Build a dashboard",
        "Preview an automation",
        "Reset the stickers",
      ],
    };
  }

  if (
    /\b(are you (an? )?ai|real ai|live ai|language model|how do you work|who are you)\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "I’m Mark’s portfolio guide. The full AI chat isn’t available for this reply, but I can still show you his work and help you explore an idea.",
      actions: [],
      suggestions: [...STARTERS],
    };
  }

  if (
    /\b(telegram|contact|reach|hire|book a call|lets talk|talk to|speak to|ask mark|message mark|get in touch|email mark|your email|email address)\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "Here’s how to reach Mark. Share what you have in mind and what you’d like to build.",
      actions: [{ type: "navigate", target: "contact" }],
      suggestions: [
        "Show me your work",
        "Preview my website idea",
        "Meet the human",
      ],
      needsHuman: true,
    };
  }

  // A known employer/tool is not a reason to fabricate private or commercial facts.
  if (
    /\b(salary|revenue|clients?|customers?|age|birthday|born|married|wife|husband|family|address|phone|how many|rates?|prices?|pricing|costs?|budget|available|availability|hobbies|favorite|favourite|education|degree|university|graduation|studied|where did you study)\b/.test(
      text,
    )
  )
    return unknown();

  const employer = workExperience.find((role) =>
    (COMPANY_ALIASES[role.id] ?? [role.company]).some((alias) =>
      includesPhrase(text, alias),
    ),
  );
  if (employer) {
    return {
      reply: `${employer.company}: ${employer.role}, ${employer.period}. ${employer.summary}`,
      actions: [{ type: "navigate", target: "experience" }],
      suggestions: [
        "Show your work experience",
        "What tools do you use?",
        "Show me your work",
      ],
    };
  }

  if (
    /\b(experience|career|work history|employment|resume|cv|background|current role|current job|jobs|where (?:do you|does mark|does he) work|where have you worked|what is your job)\b/.test(
      text,
    )
  ) {
    const current = workExperience.find((role) => role.isCurrent);
    const currentLine = current
      ? `Mark is currently an ${current.role} at ${current.company} (${current.period}). `
      : "";
    return {
      reply: `${currentLine}His earlier chapters include marketing, creative production, business development and banking. The timeline goes back to Digital Dream Studios in June 2014. Open a role to see the details.`,
      actions: [{ type: "navigate", target: "experience" }],
      suggestions: [
        "Tell me about BotBuilders",
        "Show your skills",
        "Show me your work",
      ],
    };
  }

  if (
    /\b(skills?|toolkit|tech stack|technology stack|technologies|expertise|what tools|tools do|speciali[sz]e|services|what do you do|what can (?:you|mark) (?:do|help|build)|what are you good at)\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "Mark builds **applications, tools and workflow automations with AI**. His coding workflow includes **Claude Code, Codex and Hermes**, with **Railway and Cloudflare** among the platforms he reaches for to ship applications. Explore how he works and the rest of his stack below.",
      actions: [{ type: "navigate", target: "skills" }],
      suggestions: [
        "Tell me about Codex",
        "Tell me about Railway",
        "Show me Courtfolio",
      ],
    };
  }

  // A named tool can be part of a build request, rather than a question about skills.
  if (/\b(preview|simulate|demo|build|create|make|automate)\b/.test(text)) {
    if (/\b(dashboard|analytics|reporting|admin panel|crm)\b/.test(text))
      return preview("dashboard");
    if (/\b(automation|workflow|automate)\b/.test(text))
      return preview("automation");
    if (/\b(website|landing page|web page|site preview)\b/.test(text))
      return preview("website");
  }

  const tool = tools.find((item) => includesPhrase(text, item.name));
  if (tool) {
    return {
      reply: `Mark’s toolkit includes ${tool.name}. ${tool.description} You can explore the related disciplines here.`,
      actions: [{ type: "navigate", target: "skills" }],
      suggestions: [
        "Show your skills",
        "Show your work experience",
        "Preview an automation",
      ],
    };
  }

  // Do not turn other unverified commercial, private or biographical details into facts.
  if (
    /\b(pric(?:e|es|ing)|costs?|rates?|budget|available|availability|salary|revenue|clients?|customers?|age|birthday|born|married|wife|husband|family|address|phone|hobbies|favorite|favourite|education|degree|university|years of experience|how long|where (?:are|is|does|did) (?:you|he|mark)|where (?:do you|does he) live|how many|when (?:did|was|is))\b/.test(
      text,
    )
  ) {
    return unknown();
  }

  const projects = projectIds(text);
  if (projects.length === 1) return showProject(projects[0]);
  if (projects.length > 1) {
    return {
      reply:
        "Let’s put the projects together so you can explore them. Open a card for its story, or pick one below and I’ll bring it into view.",
      actions: [{ type: "navigate", target: "work" }],
      suggestions: projects.map((id) => `Show me ${PROJECT_NAMES[id]}`),
    };
  }

  if (
    /^(show me|show it|show me it|show me more|open it|take me there|see it|view it|tell me more|more about (it|that))$/.test(
      text,
    )
  ) {
    const previousProject = projectIds(
      normalize(context?.lastProject ?? ""),
    )[0];
    if (previousProject) return showProject(previousProject);
    return {
      reply: "Absolutely. Pick a project and I’ll bring it into view.",
      actions: [{ type: "navigate", target: "work" }],
      suggestions: [
        "Show me Courtfolio",
        "Show me HelloMarky",
        "Show me PicklePals",
      ],
    };
  }

  if (/\b(dashboard|analytics|reporting|admin panel|crm)\b/.test(text))
    return preview("dashboard");
  if (
    /\b(automation|workflow|automate)\b/.test(text) &&
    !/\b(expertise|speciali[sz]e|skills|what do you do)\b/.test(text)
  )
    return preview("automation");
  if (
    /\b(website|landing page|web page|site preview)\b/.test(text) &&
    /\b(build|make|create|preview|idea|custom|show|design)\b/.test(text)
  )
    return preview("website");

  if (/\b(home|top|start over|beginning)\b/.test(text)) {
    return {
      reply: "Back to the beginning. There’s room for another good idea.",
      actions: [{ type: "navigate", target: "home" }],
      suggestions: [...STARTERS],
    };
  }

  if (
    /\b(about|human|life|introduce|who is mark|who is renzo|tell me about yourself)\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "The human is Mark Renzo Mariveles, an AI builder and product developer. He creates applications, tools and automations with AI, drawing on a background in creative work and marketing. Here’s a little more of the person behind the projects.",
      actions: [{ type: "navigate", target: "about" }],
      suggestions: ["Show me your work", "What can you build?", "Contact Mark"],
    };
  }

  if (
    /\b(playground|play|build|make|create|preview|try|interactive|idea|ideas)\b/.test(
      text,
    )
  ) {
    return {
      reply:
        "Let’s give your idea a first shape. Try a dashboard, automation, or website demo, then tell Mark what you’d like to build.",
      actions: [{ type: "navigate", target: "playground" }],
      suggestions: [
        "Build a dashboard",
        "Preview an automation",
        "Build a website",
      ],
    };
  }

  if (
    /\b(projects?|portfolio|selected work|your work|case stud(?:y|ies))\b/.test(
      text,
    ) ||
    /^(?:work|(?:show|open|scroll|take|go)\b.*\bwork)$/.test(text)
  ) {
    return {
      reply:
        "Here’s the work: six projects, from AI-powered tools and community apps to a business website. Pick a project to explore the product and the story behind it.",
      actions: [{ type: "navigate", target: "work" }],
      suggestions: [
        "Show me HelloMarky",
        "Show me Courtfolio",
        "Show me PicklePals",
      ],
    };
  }

  if (
    /^(thanks|thank you|thank you so much|nice|cool|awesome|love it)$/.test(
      text,
    )
  ) {
    return {
      reply: "You’re welcome. There’s more to explore whenever you’re ready.",
      actions: [],
      suggestions: [...STARTERS],
    };
  }

  return unknown();
}

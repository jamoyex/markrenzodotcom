import type { SiteAction } from "./guide";
import { findProjectIds, isProjectId, type ProjectId } from "./project-ids";

export type GuideContext = {
  section?:
    | "home"
    | "work"
    | "skills"
    | "experience"
    | "playground"
    | "about"
    | "contact";
  project?: ProjectId;
  preview?: {
    status: "empty" | "generating" | "ready" | "failed";
    prompt?: string;
    nextAllowedAt?: string;
  };
};

type Turn = {
  role: "user" | "assistant" | "mark";
  content: string;
  question?: string;
};
type Options = {
  context?: GuideContext;
  conversation?: Turn[];
  candidates?: string[];
  focus?: "page" | "conversation";
  actions?: SiteAction[];
};
type Project = NonNullable<GuideContext["project"]>;
type Topic =
  | Project
  | "food"
  | "travel"
  | "personal"
  | "flower"
  | "email"
  | "preview"
  | "skills"
  | "experience"
  | "contact"
  | "work"
  | "home";

const SECTIONS = new Set([
  "home",
  "work",
  "skills",
  "experience",
  "playground",
  "about",
  "contact",
]);
const STATUSES = new Set(["empty", "generating", "ready", "failed"]);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isoDate(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  const parts =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(
      value,
    );
  if (!parts) return;
  const [, year, month, day, hour, minute, second, zone] = parts;
  const days = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  if (
    Number(month) < 1 ||
    Number(month) > 12 ||
    Number(day) < 1 ||
    Number(day) > days ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59
  )
    return;
  if (
    zone !== "Z" &&
    (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)
  )
    return;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp)
    ? new Date(timestamp).toISOString()
    : undefined;
}

/** UI hints only: no arbitrary fields, executable data, or trusted personal facts. */
export function normalizeGuideContext(value: unknown): GuideContext {
  if (!record(value)) return {};
  const context: GuideContext = {};
  if (typeof value.section === "string" && SECTIONS.has(value.section))
    context.section = value.section as GuideContext["section"];
  if (isProjectId(value.project)) context.project = value.project;
  if (
    record(value.preview) &&
    typeof value.preview.status === "string" &&
    STATUSES.has(value.preview.status)
  ) {
    const preview: NonNullable<GuideContext["preview"]> = {
      status: value.preview.status as NonNullable<
        GuideContext["preview"]
      >["status"],
    };
    if (typeof value.preview.prompt === "string") {
      const prompt = value.preview.prompt
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, 1200);
      if (prompt) preview.prompt = prompt;
    }
    const date = isoDate(value.preview.nextAllowedAt);
    if (date) preview.nextAllowedAt = date;
    context.preview = preview;
  }
  return context;
}

function words(value: string): string {
  return value
    .slice(0, 4000)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

function projectIn(value: string): Project | undefined {
  return findProjectIds(value)[0];
}

function topicIn(text: string): Topic | undefined {
  const value = words(text);
  const project = projectIn(value);
  if (project) return project;
  if (/\b(?:food|dish|cuisine|cooking|cook|sinigang|eat|eating)\b/.test(value))
    return "food";
  if (/\b(?:travel|trip|destination|holiday|vacation)\b/.test(value))
    return "travel";
  if (
    /\b(?:favorite|favourite|hobbies|hobby|personal|outside work|for fun|inspire|inspires|inspiration|music|movie|book|life)\b/.test(
      value,
    )
  )
    return "personal";
  if (
    /\b(?:flower|flowers|florist|bouquet|bouquets|sunday stems)\b/.test(value)
  )
    return "flower";
  if (/\b(?:email|inbox|mail|follow up|followup)\b/.test(value)) return "email";
  if (
    /\b(?:experience|career|roles|current role|job|jobs|botbuilders|bpi|employer|worked)\b/.test(
      value,
    )
  )
    return "experience";
  if (
    /\b(?:skills|stack|tools|expertise|capabilities|can mark build|can mark automate|build ai agents)\b/.test(
      value,
    )
  )
    return "skills";
  if (
    /\b(?:contact|hire|collaborate|collaboration|work together|get in touch|project brief)\b/.test(
      value,
    )
  )
    return "contact";
  if (
    /\b(?:preview|dashboard|prototype|automation|workflow|website|landing page)\b/.test(
      value,
    )
  )
    return "preview";
  if (
    /\b(?:projects|portfolio|selected work|your work|marks work)\b/.test(value)
  )
    return "work";
}

const REPLIES: Record<Topic, string[]> = {
  home: [
    "Show me Mark’s work",
    "What can Mark build?",
    "What does Mark do for fun?",
    "How does Mark approach a new idea?",
    "Show me his experience",
  ],
  work: [
    "Show me Courtfolio",
    "Show me HelloMarky",
    "Show me PicklePals",
    "Show me SelfHelp AI",
    "Show me Parking Buddy",
    "Show me Next Move Asia",
    "How does Mark approach a project?",
    "What can Mark build?",
  ],
  courtfolio: [
    "How does Courtfolio work?",
    "Who is Courtfolio for?",
    "What’s Courtfolio built with?",
    "What was Mark’s role in Courtfolio?",
    "Show me HelloMarky",
    "Show me PicklePals",
  ],
  hellomarky: [
    "What can HelloMarky do?",
    "Who is HelloMarky for?",
    "What’s HelloMarky built with?",
    "How could AI help my business?",
    "Show me Courtfolio",
    "Show me PicklePals",
  ],
  "pickle-pals": [
    "How does PicklePals work?",
    "Who is PicklePals for?",
    "What did Mark build for PicklePals?",
    "What’s PicklePals built with?",
    "Show me Courtfolio",
    "Show me HelloMarky",
  ],
  "selfhelp-ai": [
    "How does SelfHelp AI work?",
    "Who is SelfHelp AI for?",
    "How does SelfHelp AI use course content?",
    "What happens when SelfHelp AI needs a human?",
    "Show me Hello Marky",
  ],
  "parking-buddy": [
    "What is Parking Buddy?",
    "Who is Parking Buddy for?",
    "How does Parking Buddy work?",
    "What’s Parking Buddy built with?",
    "Show me Courtfolio",
  ],
  "next-move-asia": [
    "What is Next Move Asia?",
    "Who is the Next Move Asia website for?",
    "What did Mark build for Next Move Asia?",
    "What’s the Next Move Asia website built with?",
    "How could Mark help with my website?",
  ],
  skills: [
    "How does Mark build applications with AI?",
    "What kinds of tools does Mark create?",
    "Which tools does Mark use?",
    "How does Mark choose a tech stack?",
    "What’s Mark’s design process?",
    "Which project shows these skills?",
  ],
  experience: [
    "What’s Mark’s current role?",
    "How did Mark get into AI?",
    "Which roles shaped Mark’s work?",
    "What did Mark do before working in AI?",
    "How has Mark’s work changed?",
    "Which skills connect his past roles?",
  ],
  personal: [
    "What does Mark do for fun?",
    "What inspires Mark?",
    "What’s Mark’s favorite food?",
    "Where would Mark like to travel?",
    "What’s Mark’s favorite movie?",
    "What music does Mark enjoy?",
    "What’s Mark’s favorite book?",
    "How does Mark spend a quiet weekend?",
    "What would Mark like to learn next?",
    "What sparked Mark’s interest in making things?",
  ],
  food: [
    "Does Mark enjoy cooking?",
    "What other food does Mark enjoy?",
    "What does Mark do for fun?",
    "What’s Mark’s favorite cuisine?",
    "Is there a dish Mark wants to try?",
    "What’s Mark’s favorite dessert?",
    "What food reminds Mark of home?",
  ],
  travel: [
    "Where would Mark like to travel next?",
    "What does Mark enjoy about traveling?",
    "What’s Mark’s favorite travel memory?",
    "What does Mark like to explore on a trip?",
    "What does Mark do for fun?",
  ],
  contact: [
    "What should I include in a project brief?",
    "How could Mark help with my idea?",
    "What does working together look like?",
    "How do I scope a first version?",
    "Which project is closest to my idea?",
  ],
  flower: [
    "What would help this flower shop launch?",
    "How could bouquet ordering work?",
    "What could make this shop stand out?",
    "How could delivery options work?",
    "How could Mark turn this into a real site?",
  ],
  email: [
    "How could this email workflow save time?",
    "Which steps should stay human?",
    "How could follow-up reminders work?",
    "How would this handle unusual emails?",
    "How could Mark connect this to my tools?",
  ],
  preview: [
    "How could this idea work in practice?",
    "What should the first version include?",
    "How could Mark help build this?",
    "Which parts could be automated?",
    "What would make this easier to use?",
  ],
};

function pageTopic(context: GuideContext): Topic {
  if (context.project) return context.project;
  if (context.section === "playground")
    return topicIn(context.preview?.prompt || "") || "preview";
  if (context.section === "about") return "personal";
  return context.section || "home";
}

function opensProject(value: string): Project | undefined {
  return /^(?:(?:can|could|would) you )?(?:show|open|visit|view|explore|see|take|look)\b/.test(
    value,
  )
    ? projectIn(value)
    : undefined;
}

function navigation(value: string): GuideContext["section"] | undefined {
  if (
    !/^(?:(?:can|could|would) you )?(?:show|open|visit|view|explore|see|take|go|meet|contact|get in touch|return|back)\b/.test(
      value,
    )
  )
    return;
  if (/\b(?:contact|touch)\b/.test(value)) return "contact";
  if (/\b(?:experience|career)\b/.test(value)) return "experience";
  if (/\b(?:skills|stack|tools)\b/.test(value)) return "skills";
  if (/\b(?:projects|portfolio|work)\b/.test(value)) return "work";
  if (/\b(?:human|about)\b/.test(value)) return "about";
  if (/\b(?:playground|builder)\b/.test(value)) return "playground";
  if (/\bhome\b/.test(value)) return "home";
}

function buildRequest(value: string): boolean {
  if (
    /\b(?:another|new|different|fresh|again|next)\b/.test(value) &&
    /\b(?:build|building|make|making|create|creating|generate|generating|preview|dashboard|website|automation|workflow|prototype)\b/.test(
      value,
    )
  )
    return true;
  if (
    /\b(?:my|current|saved|existing) preview\b/.test(value) &&
    /\b(?:show|open|view|see|explain)\b/.test(value) &&
    !/\b(?:build|make|create|generate|try|start|design)\b/.test(value)
  )
    return false;
  if (/^(?:what|how|which|why|who|when)\b/.test(value)) return false;
  return (
    /\b(?:build|make|create|generate|try|preview|start|design)\b/.test(value) ||
    (/\b(?:show|open|see)\b/.test(value) &&
      /\b(?:dashboard|automation|website|workflow|prototype)\b/.test(value))
  );
}

function projectFeatures(text: string): Project | undefined {
  // Match only a broad feature question, not deeper questions such as
  // "How does Courtfolio work offline?". A later opt-out is a separate sentence.
  const question = words(text.split(/[.!?。！？\n]/u, 1)[0])
    .replace(/^please /, "")
    .replace(
      / (?:use|using) (?:only )?(?:the )?existing knowledge(?: only)?$/,
      "",
    );
  const match =
    /^(?:what can (.+) do|what features does (.+) (?:have|offer)|how does (.+) work)$/.exec(
      question,
    );
  const name = match?.[1] || match?.[2] || match?.[3];
  if (
    name &&
    /^(?:court\s*folio|cortfolio|hello\s*marky|pickle\s*pals|self\s*help(?:\s*ai)?|parking\s*buddy|next\s*move\s*asia)$/.test(
      name,
    )
  )
    return projectIn(name);
}

function signature(text: string): string {
  const features = projectFeatures(text);
  if (features) return `features:${features}`;
  const value = words(text).replace(/^please /, "");
  const project = opensProject(value);
  if (project) return `project:${project}`;
  const section = navigation(value);
  if (section) return `section:${section}`;
  return value
    .replace(/\bfavourite\b/g, "favorite")
    .replace(/\bwhats\b/g, "what is")
    .replace(
      /\b(?:can you|could you|would you|please|marks|mark|his|your|me|the|a|an)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/** Synchronous suggestions: scrolling and owner replies never trigger another model call. */
export function getQuickReplies(options: Options = {}): string[] {
  const context = normalizeGuideContext(options.context);
  const turns = (options.conversation || []).slice(-24);
  const latest = turns.at(-1);
  const focus = options.focus || (latest ? "conversation" : "page");
  const actions = options.actions || [];
  const recentQuestions = turns
    .flatMap((turn) =>
      turn.role === "user"
        ? [turn.content]
        : turn.role === "mark" && turn.question
          ? [turn.question]
          : [],
    )
    .slice(-8);
  const asked = new Set(recentQuestions.map(signature));
  const opened = new Set<Project>(context.project ? [context.project] : []);
  const visited = new Set<GuideContext["section"]>(
    context.section ? [context.section] : [],
  );
  actions.forEach((action) => {
    if (action.type === "project") opened.add(action.id);
    if (action.type === "navigate") visited.add(action.target);
  });
  const latestUser = [...turns].reverse().find((turn) => turn.role === "user");
  const lastProject = [...actions]
    .reverse()
    .find((action) => action.type === "project");
  let topic = pageTopic(context);
  if (focus === "conversation") {
    if (latest?.role === "mark")
      topic =
        topicIn(`${latest.question || ""} ${latest.content}`) || "personal";
    else
      topic =
        lastProject?.id ||
        topicIn(latestUser?.content || "") ||
        topicIn(latest?.content || "") ||
        topic;
  }
  const preview = context.preview;
  const blockedBuild =
    preview?.status === "generating" ||
    (preview?.nextAllowedAt !== undefined &&
      Date.parse(preview.nextAllowedAt) > Date.now());
  const personal = ["food", "travel", "personal"].includes(topic);
  // Model candidates belong to its response, not a later reply directly from Mark.
  const candidates =
    focus === "conversation" && latest?.role !== "mark"
      ? options.candidates || []
      : [];
  let contextual = REPLIES[topic];
  if (topic === "preview" && preview?.status === "empty" && !blockedBuild)
    contextual = [
      "Try a dashboard",
      "Preview an email workflow",
      "Preview a photography booking website",
      ...contextual,
    ];
  if (
    preview?.status === "generating" &&
    (topic === "preview" || topic === "flower" || topic === "email")
  )
    contextual = [...REPLIES[topic], "What should I test when it’s ready?"];
  const pool = [
    ...candidates,
    ...contextual,
    ...(personal
      ? [...REPLIES.personal, ...REPLIES.food, ...REPLIES.travel]
      : [
          ...REPLIES.contact,
          ...REPLIES.skills,
          ...REPLIES.experience,
          ...REPLIES.home,
        ]),
  ];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of pool) {
    if (typeof raw !== "string") continue;
    const chip = raw.trim();
    if (
      !chip ||
      chip.length > 100 ||
      /[<>\u0000-\u001f\u007f]|https?:\/\/|www\.|javascript:/i.test(chip)
    )
      continue;
    const value = words(chip);
    const key = signature(chip);
    const project = opensProject(value);
    const section = navigation(value);
    if (
      asked.has(key) ||
      seen.has(key) ||
      (project && opened.has(project)) ||
      (section && visited.has(section))
    )
      continue;
    if (blockedBuild && buildRequest(value)) continue;
    if (
      actions.some((action) => action.type === "celebrate") &&
      /\b(?:surprise|celebrate|confetti)\b/.test(value)
    )
      continue;
    if (
      actions.some((action) => action.type === "reset-stickers") &&
      /\breset\b/.test(value)
    )
      continue;
    if (
      actions.some(
        (action) =>
          action.type === "preview" &&
          buildRequest(value) &&
          value.includes(action.kind),
      )
    )
      continue;
    seen.add(key);
    result.push(chip);
    if (result.length === 3) break;
  }
  return result;
}

import {
  capabilityGroups,
  profileSources,
  skills,
  tools,
  workExperience,
} from "@/data/profile";
import { projects } from "@/data/projects";
import type { KnowledgeEntry } from "./store";
import { canonicalKnowledgeQuestion } from "./knowledge-context";

export type { KnowledgeEntry } from "./store";

// Public portfolio facts only. No storage, environment or provider access occurs here.
export const PUBLIC_PROJECTS = projects.map((project) => ({
  id: project.id,
  name: project.name,
  category: project.category,
  audience: project.audience,
  description: project.summary,
  stack: project.stack,
  ...(project.website ? { url: project.website } : {}),
  storyUrl: `/work/${project.id}`,
  introduction: project.intro,
  story: project.sections.map(({ title, paragraphs }) => ({
    title,
    paragraphs,
  })),
}));

const PUBLIC_PROFILE = {
  name: "Mark Renzo Mariveles",
  positioning:
    "AI builder and product developer creating applications, tools and automations with AI. His current employed role is AI & Automation Specialist at BotBuilders.",
  currentFocus:
    "As of 2026, Mark’s work increasingly focuses on making applications and automations. His approach includes AI-assisted software engineering and vibe coding, using Claude Code, Codex and Hermes. Railway and Cloudflare are among the platforms he reaches for when building and shipping applications.",
  contact: {
    linkedin: "https://www.linkedin.com/in/markrenzo/",
    instagram: "https://www.instagram.com/jamoyex/",
    businessEmail: "hi@hellomarky.com",
  },
  sourceStatus: profileSources,
  workExperience: workExperience.map(
    ({
      company,
      role,
      employmentType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      achievements,
      sourceUrl,
    }) => ({
      company,
      role,
      employmentType,
      location,
      startDate,
      endDate,
      isCurrent,
      description,
      achievements,
      sourceUrl,
    }),
  ),
  skills,
  tools: tools.map(({ name, description, sourceUrl }) => ({
    name,
    description,
    sourceUrl,
  })),
  capabilityGroups,
  projects: PUBLIC_PROJECTS,
  unknowns:
    "Education, private life details, pricing, project usage or revenue metrics, and current project availability are unknown unless explicitly covered by an owner-published fact below. Do not infer them from employment, photos or project names.",
};

/** A bounded snapshot with canonical topic context. Visitor text is never copied. */
export function buildKnowledgeContext(
  entries: readonly KnowledgeEntry[],
): string {
  const published: {
    answer: string;
    question?: string;
    source: string;
    verifiedAt: string;
  }[] = [];
  let remaining = 64_000;
  // The store returns oldest first; prefer recent whole entries rather than cutting facts in half.
  for (const entry of entries.slice(-200).reverse()) {
    if (entry.source !== "telegram-owner" || typeof entry.answer !== "string")
      continue;
    const answer = entry.answer.trim();
    const question = canonicalKnowledgeQuestion(entry.question);
    const length = answer.length + (question?.length ?? 0);
    if (!answer || answer.length > 6_000 || length > remaining) continue;
    remaining -= length;
    published.push({
      answer,
      ...(question ? { question } : {}),
      source: entry.source,
      verifiedAt: entry.verifiedAt,
    });
  }
  return JSON.stringify({
    publicPortfolio: PUBLIC_PROFILE,
    ownerPublishedFacts: published,
  });
}

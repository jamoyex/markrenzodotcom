/** Public project destinations shared by the guide and the project pages. */
export const PROJECT_IDS = [
  "courtfolio",
  "hellomarky",
  "pickle-pals",
  "selfhelp-ai",
  "parking-buddy",
  "next-move-asia",
] as const;

export type ProjectId = (typeof PROJECT_IDS)[number];

export const PROJECT_NAMES: Record<ProjectId, string> = {
  courtfolio: "Courtfolio",
  hellomarky: "Hello Marky",
  "pickle-pals": "PicklePals",
  "selfhelp-ai": "SelfHelp AI",
  "parking-buddy": "Parking Buddy",
  "next-move-asia": "Next Move Asia",
};

const aliases: Record<ProjectId, RegExp> = {
  courtfolio: /\b(?:court\s*folio|cortfolio)\b/,
  hellomarky: /\bhello\s*marky\b/,
  "pickle-pals": /\bpickle\s*pals\b/,
  "selfhelp-ai": /\b(?:selfhelp(?:\s*ai)?|self\s+help\s+ai)\b/,
  "parking-buddy": /\bparking\s*buddy\b/,
  "next-move-asia": /\bnext\s*move\s*asia\b/,
};

export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === "string" && PROJECT_IDS.some((id) => id === value);
}

/** Matches ordinary project names, spacing and route slugs; never produces a URL. */
export function findProjectIds(value: string): ProjectId[] {
  const text = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  return PROJECT_IDS.filter((id) => aliases[id].test(text));
}

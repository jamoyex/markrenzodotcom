import type { SiteAction } from "./guide";
import { isProjectId } from "./project-ids";

const sections = new Set([
  "home",
  "work",
  "about",
  "skills",
  "experience",
  "playground",
  "contact",
]);
const previews = new Set(["dashboard", "automation", "website"]);

/** The complete browser capability boundary; no selectors, URLs, HTML or code. */
export function validateSiteAction(value: unknown): value is SiteAction {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  const only = (...keys: string[]) =>
    Object.keys(item).every((key) => keys.includes(key));
  switch (item.type) {
    case "navigate":
      return (
        only("type", "target") &&
        typeof item.target === "string" &&
        sections.has(item.target)
      );
    case "project":
      return only("type", "id") && isProjectId(item.id);
    case "preview":
      return (
        only("type", "kind", "title") &&
        typeof item.kind === "string" &&
        previews.has(item.kind) &&
        (item.title === undefined ||
          (typeof item.title === "string" &&
            item.title.length <= 100 &&
            !/[<>\u0000-\u001f]/.test(item.title)))
      );
    case "celebrate":
    case "reset-stickers":
      return only("type");
    default:
      return false;
  }
}

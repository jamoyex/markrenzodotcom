import type { SiteAction } from "./guide";
import { validateSiteAction } from "./site-actions";

export type GuideLink =
  | { kind: "site"; href: string; action: SiteAction }
  | { kind: "external" | "email"; href: string };

/** Markdown links can navigate to known site destinations or ordinary web URLs. */
export function resolveGuideLink(value: string | undefined): GuideLink | null {
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return null;

  if (value.startsWith("/work/")) {
    const id = value.slice("/work/".length).replace(/\/$/, "");
    const action = { type: "project", id };
    return validateSiteAction(action)
      ? { kind: "site", href: `/work/${id}`, action }
      : null;
  }

  const hash = value.startsWith("/#") ? value.slice(1) : value;
  if (hash.startsWith("#")) {
    const action = hash.startsWith("#project/")
      ? { type: "project", id: hash.slice("#project/".length) }
      : { type: "navigate", target: hash.slice(1) };
    return validateSiteAction(action)
      ? { kind: "site", href: hash, action }
      : null;
  }

  if (
    /^mailto:[a-z0-9.!#$&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(
      value,
    )
  ) {
    return { kind: "email", href: value };
  }

  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    if (!url.hostname || url.username || url.password) return null;
    return { kind: "external", href: url.href };
  } catch {
    return null;
  }
}

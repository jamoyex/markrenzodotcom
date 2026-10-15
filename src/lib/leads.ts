/** Shared validation; a draft is never permission to send it. */
export type LeadDraft = {
  name: string;
  email: string;
  brief: string;
  budget: string;
  timeline: string;
};
export const EMPTY_LEAD: LeadDraft = {
  name: "",
  email: "",
  brief: "",
  budget: "",
  timeline: "",
};
export function readLead(value: unknown): LeadDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const limits: Record<keyof LeadDraft, number> = {
    name: 100,
    email: 254,
    brief: 1200,
    budget: 120,
    timeline: 120,
  };
  const result = { ...EMPTY_LEAD };
  for (const field of Object.keys(limits) as (keyof LeadDraft)[]) {
    if (
      typeof obj[field] !== "string" ||
      obj[field].length > limits[field] ||
      /[\u0000-\u001f\u007f]/.test(obj[field])
    )
      return null;
    result[field] = obj[field].trim();
  }
  if (
    !result.name ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email) ||
    result.brief.length < 10
  )
    return null;
  return result;
}

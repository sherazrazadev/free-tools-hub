/**
 * Privacy-safe analytics - allowlisted event names only.
 * Never attach file contents, form field values, or free-text inputs.
 */

export const ANALYTICS_EVENTS = [
  "tool_start",
  "tool_complete",
  "tool_export",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Coarse tool identifier only (route slug). */
export type AnalyticsProps = {
  tool_id: string;
};

const TOOL_ID_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function isAnalyticsEventName(
  value: string,
): value is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(value);
}

/** Reject anything that is not a short slug - blocks accidental PII paths. */
export function sanitizeToolId(raw: string): string | null {
  const id = raw.trim().toLowerCase();
  if (!TOOL_ID_RE.test(id)) return null;
  return id;
}

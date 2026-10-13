import { isAnalyticsEnabled } from "./config";
import {
  isAnalyticsEventName,
  sanitizeToolId,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "./events";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Fire a privacy-safe tool event. No-ops when analytics is disabled or gtag is absent.
 * Only `tool_id` is sent - never files, times, amounts, or other inputs.
 */
export function track(event: AnalyticsEventName, props: AnalyticsProps): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;
  if (!isAnalyticsEventName(event)) return;

  const tool_id = sanitizeToolId(props.tool_id);
  if (!tool_id) return;

  if (typeof window.gtag !== "function") return;

  window.gtag("event", event, {
    tool_id,
    // Explicit: do not spread props - block accidental extra keys.
  });
}

export function trackToolStart(toolId: string): void {
  track("tool_start", { tool_id: toolId });
}

export function trackToolComplete(toolId: string): void {
  track("tool_complete", { tool_id: toolId });
}

export function trackToolExport(toolId: string): void {
  track("tool_export", { tool_id: toolId });
}

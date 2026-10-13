/** Shared governance checklist types (defensive self-assessment). */

export type ItemAnswer = "yes" | "no" | "na" | "unanswered";

export type FrameworkRef = {
  /** e.g. GOVERN 1.1 or LLM01:2025 */
  id: string;
  label: string;
  url: string;
};

export type ChecklistItemDef = {
  id: string;
  prompt: string;
  rationale: string;
  followUpIfNo: string;
  /** Optional mapped framework reference. */
  reference?: FrameworkRef;
};

export type ChecklistSectionDef = {
  id: string;
  title: string;
  purpose: string;
  items: ChecklistItemDef[];
};

export type AnswerMap = Record<string, ItemAnswer>;

export type ScoreSummary = {
  totalItems: number;
  answered: number;
  yes: number;
  no: number;
  na: number;
  unanswered: number;
  completionPercent: number;
  addressedPercent: number | null;
  gapItemIds: string[];
  followUps: Array<{ itemId: string; action: string }>;
};

export type ChecklistToolMeta = {
  /** Route slug for privacy-safe analytics (`tool_id`). */
  toolId: string;
  reportTitle: string;
  disclaimer: string;
  persistenceNote: string;
  /** Shown in report header (framework version / verify date). */
  frameworkNote: string;
  downloadFilename: string;
  storageKey: string;
};

export const DEFAULT_DISCLAIMER =
  "Informal self-assessment only. Completing this checklist is not an audit, certification, security guarantee, or proof of compliance.";

export const DEFAULT_PERSISTENCE_NOTE =
  "Draft answers can be saved in this browser’s localStorage on this device only. Clearing site data removes them. The downloadable report is a file you keep - nothing is uploaded to our servers.";

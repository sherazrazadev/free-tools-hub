import type { ChecklistToolMeta } from "../governance-checklist/types";
import {
  DEFAULT_DISCLAIMER,
  DEFAULT_PERSISTENCE_NOTE,
} from "../governance-checklist/types";
import { OWASP_LLM_TOP10 } from "./source";

export const OWASP_META: ChecklistToolMeta = {
  toolId: "owasp-llm-top10-checklist",
  reportTitle: "OWASP LLM Top 10 (2025) defensive checklist - summary report",
  disclaimer: `${DEFAULT_DISCLAIMER} This is a defensive control-review checklist aligned to OWASP Top 10 for LLM Applications ${OWASP_LLM_TOP10.version}. It does not claim your application is secure and does not include exploit steps.`,
  persistenceNote: DEFAULT_PERSISTENCE_NOTE,
  frameworkNote: `Source: ${OWASP_LLM_TOP10.name} ${OWASP_LLM_TOP10.version}. Verified ${OWASP_LLM_TOP10.verifiedOn}. Hub: ${OWASP_LLM_TOP10.hubUrl}. PDF: ${OWASP_LLM_TOP10.pdfUrl}.`,
  downloadFilename: "owasp-llm-top10-checklist-report.txt",
  storageKey: "tools.tommyfx.owasp-llm-top10-checklist.v1",
};

import type { ChecklistToolMeta } from "../governance-checklist/types";
import {
  DEFAULT_DISCLAIMER,
  DEFAULT_PERSISTENCE_NOTE,
} from "../governance-checklist/types";
import { NIST_AI_RMF } from "./source";

export const NIST_META: ChecklistToolMeta = {
  toolId: "nist-ai-rmf-checklist",
  reportTitle: "NIST AI RMF–aligned checklist - summary report",
  disclaimer: `${DEFAULT_DISCLAIMER} This tool is an informal self-assessment aligned to NIST AI RMF 1.0. It is not an official NIST assessment, endorsement, or certification.`,
  persistenceNote: DEFAULT_PERSISTENCE_NOTE,
  frameworkNote: `Framework: ${NIST_AI_RMF.name} (${NIST_AI_RMF.documentId}), published ${NIST_AI_RMF.published}. Sources verified ${NIST_AI_RMF.verifiedOn}. Landing: ${NIST_AI_RMF.landingUrl}. Note: NIST has indicated AI RMF 1.0 is being revised; this checklist maps to 1.0 as published.`,
  downloadFilename: "nist-ai-rmf-checklist-report.txt",
  storageKey: "tools.tommyfx.nist-ai-rmf-checklist.v1",
};

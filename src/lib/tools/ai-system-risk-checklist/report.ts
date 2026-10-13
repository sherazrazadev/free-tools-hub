import { CHECKLIST_SECTIONS } from "./catalog";
import * as shared from "../governance-checklist/report";
import { DISCLAIMER, PERSISTENCE_NOTE, type AnswerMap } from "./types";

const META = {
  toolId: "ai-system-risk-checklist",
  reportTitle: "AI System Risk Checklist - summary report",
  disclaimer: DISCLAIMER,
  persistenceNote: PERSISTENCE_NOTE,
  frameworkNote:
    "Catalog: internal defensive self-check (not a NIST/OWASP-mapped product).",
  downloadFilename: "ai-system-risk-checklist-report.txt",
  storageKey: "tools.tommyfx.ai-system-risk-checklist.v1",
};

export function buildReportText(answers: AnswerMap, generatedAt?: Date) {
  return shared.buildReportText(CHECKLIST_SECTIONS, META, answers, generatedAt);
}

export const downloadTextFile = shared.downloadTextFile;

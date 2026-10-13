/** Verified 2026-10-13 - see docs/SOURCES-AI-GOV.md */

export const NIST_AI_RMF = {
  name: "NIST AI Risk Management Framework (AI RMF) 1.0",
  documentId: "NIST AI 100-1",
  published: "2023-01-26",
  verifiedOn: "2026-10-13",
  landingUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
  pdfUrl: "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf",
  doiUrl: "https://doi.org/10.6028/NIST.AI.100-1",
  coreUrl: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
} as const;

export function nistRef(subcategoryId: string, label: string) {
  return {
    id: subcategoryId,
    label,
    url: NIST_AI_RMF.coreUrl,
  };
}

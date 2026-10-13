/** Verified 2026-10-13 - see docs/SOURCES-AI-GOV.md */

export const OWASP_LLM_TOP10 = {
  name: "OWASP Top 10 for Large Language Model Applications",
  version: "2025",
  verifiedOn: "2026-10-13",
  hubUrl: "https://genai.owasp.org/llm-top-10/",
  projectUrl:
    "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
  pdfUrl:
    "https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf",
} as const;

export function owaspRef(id: string, label: string) {
  return {
    id,
    label,
    url: OWASP_LLM_TOP10.hubUrl,
  };
}

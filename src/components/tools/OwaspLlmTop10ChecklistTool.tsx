import GovernanceChecklistTool from "./GovernanceChecklistTool";
import { CHECKLIST_SECTIONS } from "../../lib/tools/owasp-llm-top10-checklist/catalog";
import { OWASP_META } from "../../lib/tools/owasp-llm-top10-checklist/meta";
import { OWASP_LLM_TOP10 } from "../../lib/tools/owasp-llm-top10-checklist/source";

export default function OwaspLlmTop10ChecklistTool() {
  return (
    <GovernanceChecklistTool
      sections={CHECKLIST_SECTIONS}
      meta={OWASP_META}
      sourceBlurb={`Defensive control review for ${OWASP_LLM_TOP10.name} ${OWASP_LLM_TOP10.version}. Sources verified ${OWASP_LLM_TOP10.verifiedOn}. No exploit steps - identifying controls to review only.`}
    />
  );
}

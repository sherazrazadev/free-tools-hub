import GovernanceChecklistTool from "./GovernanceChecklistTool";
import { CHECKLIST_SECTIONS } from "../../lib/tools/nist-ai-rmf-checklist/catalog";
import { NIST_META } from "../../lib/tools/nist-ai-rmf-checklist/meta";
import { NIST_AI_RMF } from "../../lib/tools/nist-ai-rmf-checklist/source";

export default function NistAiRmfChecklistTool() {
  return (
    <GovernanceChecklistTool
      sections={CHECKLIST_SECTIONS}
      meta={NIST_META}
      sourceBlurb={`Aligned to ${NIST_AI_RMF.name} (${NIST_AI_RMF.documentId}), published ${NIST_AI_RMF.published}. Sources verified ${NIST_AI_RMF.verifiedOn}. Informal self-assessment only - not an official NIST assessment.`}
    />
  );
}

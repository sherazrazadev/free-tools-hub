import type { ChecklistSectionDef } from "../governance-checklist/types";
import { owaspRef } from "./source";

/**
 * Defensive control-review checklist for OWASP Top 10 for LLM Applications 2025.
 * Prompts ask whether controls exist - never how to exploit systems.
 */
export const CHECKLIST_SECTIONS: ChecklistSectionDef[] = [
  {
    id: "llm01",
    title: "LLM01:2025 Prompt Injection",
    purpose:
      "Review whether untrusted inputs can steer model behavior beyond intended instructions.",
    items: [
      {
        id: "llm01-1",
        prompt:
          "Are untrusted user/retrieved inputs treated as untrusted relative to system instructions?",
        rationale:
          "Prompt injection succeeds when untrusted text is trusted like policy.",
        followUpIfNo:
          "Separate trusted instructions from untrusted content and constrain tool use.",
        reference: owaspRef("LLM01:2025", "Prompt Injection"),
      },
      {
        id: "llm01-2",
        prompt:
          "Is there human approval (or hard blocks) for high-impact actions the model might trigger?",
        rationale: "Injected instructions are most harmful when they can act.",
        followUpIfNo:
          "Require human approval for privileged or irreversible actions.",
        reference: owaspRef("LLM01:2025", "Prompt Injection"),
      },
    ],
  },
  {
    id: "llm02",
    title: "LLM02:2025 Sensitive Information Disclosure",
    purpose:
      "Review controls that prevent secrets or personal data from leaking through model outputs.",
    items: [
      {
        id: "llm02-1",
        prompt:
          "Is sensitive data minimized in prompts, logs, and training/context sources?",
        rationale: "What the model can see can often be elicited.",
        followUpIfNo:
          "Redact secrets/PII from prompts, retrieval corpora, and logs.",
        reference: owaspRef("LLM02:2025", "Sensitive Information Disclosure"),
      },
      {
        id: "llm02-2",
        prompt:
          "Are output filters or review steps used for responses that may contain sensitive data?",
        rationale: "Disclosure often appears in free-form answers.",
        followUpIfNo:
          "Add output screening for secrets/PII on sensitive workflows.",
        reference: owaspRef("LLM02:2025", "Sensitive Information Disclosure"),
      },
    ],
  },
  {
    id: "llm03",
    title: "LLM03:2025 Supply Chain",
    purpose:
      "Review trust in models, plugins, datasets, and other third-party LLM components.",
    items: [
      {
        id: "llm03-1",
        prompt:
          "Is there an inventory of third-party models, plugins, and critical AI dependencies?",
        rationale: "Unknown supply-chain parts cannot be reviewed.",
        followUpIfNo: "Inventory third-party LLM components and owners.",
        reference: owaspRef("LLM03:2025", "Supply Chain"),
      },
      {
        id: "llm03-2",
        prompt:
          "Do you review integrity/provenance before adopting new models or AI packages?",
        rationale: "Tampered or abandoned components introduce risk.",
        followUpIfNo:
          "Add a provenance/integrity check before adopting dependencies.",
        reference: owaspRef("LLM03:2025", "Supply Chain"),
      },
    ],
  },
  {
    id: "llm04",
    title: "LLM04:2025 Data and Model Poisoning",
    purpose:
      "Review whether training, fine-tuning, or embedding data can be maliciously influenced.",
    items: [
      {
        id: "llm04-1",
        prompt:
          "Are data sources for training/fine-tuning/embeddings reviewed for integrity?",
        rationale: "Poisoned data can change model behavior.",
        followUpIfNo: "Document trusted data sources and review new corpora.",
        reference: owaspRef("LLM04:2025", "Data and Model Poisoning"),
      },
      {
        id: "llm04-2",
        prompt:
          "Can untrusted users write into stores that later become model context (e.g. RAG)?",
        rationale: "Writable retrieval stores are a common poisoning path.",
        followUpIfNo: "Restrict who can publish into retrieval/index corpora.",
        reference: owaspRef("LLM04:2025", "Data and Model Poisoning"),
      },
    ],
  },
  {
    id: "llm05",
    title: "LLM05:2025 Improper Output Handling",
    purpose:
      "Review whether model output is validated before it is executed, rendered, or trusted.",
    items: [
      {
        id: "llm05-1",
        prompt:
          "Is model output treated as untrusted before HTML, code, shell, or query execution?",
        rationale: "Unsafe handling turns text into an injection surface.",
        followUpIfNo: "Sanitize/encode outputs; never execute raw model text.",
        reference: owaspRef("LLM05:2025", "Improper Output Handling"),
      },
      {
        id: "llm05-2",
        prompt: "Are structured outputs validated against a schema before use?",
        rationale: "Schema checks reduce surprise fields and unsafe types.",
        followUpIfNo:
          "Validate JSON/tool arguments against an allowlist schema.",
        reference: owaspRef("LLM05:2025", "Improper Output Handling"),
      },
    ],
  },
  {
    id: "llm06",
    title: "LLM06:2025 Excessive Agency",
    purpose:
      "Review whether the agent/tools have more power than the use case needs.",
    items: [
      {
        id: "llm06-1",
        prompt:
          "Are tool permissions limited to the minimum needed for the use case?",
        rationale: "Excess privileges amplify any model mistake or injection.",
        followUpIfNo: "Apply least privilege to tools and credentials.",
        reference: owaspRef("LLM06:2025", "Excessive Agency"),
      },
      {
        id: "llm06-2",
        prompt:
          "Are irreversible or high-impact tool actions gated by a human?",
        rationale: "Autonomous high-impact actions need a brake.",
        followUpIfNo: "Require confirmation for delete/pay/send/admin actions.",
        reference: owaspRef("LLM06:2025", "Excessive Agency"),
      },
    ],
  },
  {
    id: "llm07",
    title: "LLM07:2025 System Prompt Leakage",
    purpose:
      "Review whether system prompts expose secrets or sensitive policy details.",
    items: [
      {
        id: "llm07-1",
        prompt:
          "Are secrets (API keys, credentials) kept out of system prompts?",
        rationale: "System prompts can be extracted or leaked.",
        followUpIfNo:
          "Move secrets to a secure store; never put keys in prompts.",
        reference: owaspRef("LLM07:2025", "System Prompt Leakage"),
      },
      {
        id: "llm07-2",
        prompt:
          "Do you avoid relying on “hidden” prompt text alone as a security control?",
        rationale: "Prompt secrecy is not an access-control boundary.",
        followUpIfNo:
          "Enforce authorization in application code, not only in prompts.",
        reference: owaspRef("LLM07:2025", "System Prompt Leakage"),
      },
    ],
  },
  {
    id: "llm08",
    title: "LLM08:2025 Vector and Embedding Weaknesses",
    purpose:
      "Review retrieval/embedding pipelines for access control and data integrity.",
    items: [
      {
        id: "llm08-1",
        prompt:
          "Does retrieval enforce the same access controls as the source documents?",
        rationale: "Embeddings can bypass document ACLs if not filtered.",
        followUpIfNo: "Filter RAG results by user/tenant permissions.",
        reference: owaspRef("LLM08:2025", "Vector and Embedding Weaknesses"),
      },
      {
        id: "llm08-2",
        prompt:
          "Is retrieval content validated or partitioned so tenants cannot poison each other?",
        rationale: "Shared indexes without isolation enable cross-tenant risk.",
        followUpIfNo: "Partition indexes and validate ingested chunks.",
        reference: owaspRef("LLM08:2025", "Vector and Embedding Weaknesses"),
      },
    ],
  },
  {
    id: "llm09",
    title: "LLM09:2025 Misinformation",
    purpose:
      "Review whether users are protected from confident but wrong model outputs.",
    items: [
      {
        id: "llm09-1",
        prompt:
          "Does the product disclose that outputs can be incorrect or incomplete?",
        rationale: "Over-trust drives harmful decisions.",
        followUpIfNo: "Add clear uncertainty/disclaimer copy near answers.",
        reference: owaspRef("LLM09:2025", "Misinformation"),
      },
      {
        id: "llm09-2",
        prompt:
          "For high-stakes answers, is there grounding, citation, or human review?",
        rationale:
          "Unaided free-form answers are risky for critical decisions.",
        followUpIfNo:
          "Require sources or human review for high-stakes workflows.",
        reference: owaspRef("LLM09:2025", "Misinformation"),
      },
    ],
  },
  {
    id: "llm10",
    title: "LLM10:2025 Unbounded Consumption",
    purpose:
      "Review rate limits and cost/resource controls against abusive or runaway usage.",
    items: [
      {
        id: "llm10-1",
        prompt:
          "Are there rate limits / quotas on model calls per user or tenant?",
        rationale: "Unbounded calls enable denial of wallet and DoS.",
        followUpIfNo: "Add per-user/tenant quotas and alerting.",
        reference: owaspRef("LLM10:2025", "Unbounded Consumption"),
      },
      {
        id: "llm10-2",
        prompt:
          "Are max tokens, timeouts, and recursion/tool-loop limits enforced?",
        rationale: "Runaway generations and agent loops burn resources.",
        followUpIfNo: "Cap tokens, time, and tool-loop depth.",
        reference: owaspRef("LLM10:2025", "Unbounded Consumption"),
      },
    ],
  },
];

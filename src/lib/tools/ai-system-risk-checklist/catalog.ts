import type { ChecklistSectionDef } from "./types";

/**
 * AI System Risk Checklist catalog - defensive self-check prompts.
 * Internal rationale only (not a mapped NIST/OWASP product; those are later tickets).
 */
export const CHECKLIST_SECTIONS: ChecklistSectionDef[] = [
  {
    id: "intended-use",
    title: "Intended use",
    purpose:
      "Confirm what the system is for, who it serves, and what is out of scope.",
    items: [
      {
        id: "iu-1",
        prompt: "Is the primary intended use written down in plain language?",
        rationale:
          "Unclear use makes risk review and user expectations hard to manage.",
        followUpIfNo:
          "Draft a short intended-use statement and share it with owners.",
      },
      {
        id: "iu-2",
        prompt: "Are prohibited or out-of-scope uses listed?",
        rationale: "Boundaries reduce misuse and scope creep.",
        followUpIfNo:
          "Add an explicit “do not use for…” list to the product brief.",
      },
    ],
  },
  {
    id: "ownership",
    title: "System ownership",
    purpose:
      "Name who owns decisions, changes, and escalation for the AI system.",
    items: [
      {
        id: "own-1",
        prompt: "Is there a named product/system owner?",
        rationale: "Accountability needs a human owner, not only a team alias.",
        followUpIfNo: "Assign a primary owner and a backup contact.",
      },
      {
        id: "own-2",
        prompt: "Is it clear who can approve model or prompt changes?",
        rationale: "Uncontrolled changes create silent risk.",
        followUpIfNo:
          "Define a simple change-approval path for AI behavior updates.",
      },
    ],
  },
  {
    id: "data-sensitivity",
    title: "Data sensitivity",
    purpose: "Understand what data the system touches and how sensitive it is.",
    items: [
      {
        id: "data-1",
        prompt: "Are input and training/context data categories documented?",
        rationale: "You cannot protect what you have not inventoried.",
        followUpIfNo:
          "List data types (PII, secrets, public, etc.) used by the system.",
      },
      {
        id: "data-2",
        prompt: "Is there a rule for handling sensitive or regulated data?",
        rationale: "Sensitive inputs need explicit handling rules.",
        followUpIfNo:
          "Write redaction / retention / “do not send” rules for sensitive data.",
      },
    ],
  },
  {
    id: "human-oversight",
    title: "Human oversight",
    purpose: "Check that people can review, override, or stop harmful outputs.",
    items: [
      {
        id: "ho-1",
        prompt:
          "Can a human review or override high-impact outputs before they take effect?",
        rationale: "Automation without oversight increases harm potential.",
        followUpIfNo: "Add a human review step for high-impact actions.",
      },
      {
        id: "ho-2",
        prompt: "Do users know the system can be wrong?",
        rationale: "Over-trust is a common failure mode.",
        followUpIfNo:
          "Add clear UI copy that outputs are assistive and may be incorrect.",
      },
    ],
  },
  {
    id: "access",
    title: "Access permissions",
    purpose: "Limit who can use, configure, or export from the system.",
    items: [
      {
        id: "acc-1",
        prompt: "Is access limited to intended roles or accounts?",
        rationale: "Open access expands the impact of mistakes or misuse.",
        followUpIfNo: "Apply role-based access or invite-only controls.",
      },
      {
        id: "acc-2",
        prompt: "Are admin/config privileges separated from everyday use?",
        rationale: "Privilege separation reduces accidental misconfiguration.",
        followUpIfNo: "Split admin roles from standard operator roles.",
      },
    ],
  },
  {
    id: "logging",
    title: "Logging and monitoring",
    purpose:
      "Ensure you can detect problems without logging secrets unnecessarily.",
    items: [
      {
        id: "log-1",
        prompt: "Are failures, abuse signals, or unusual usage monitored?",
        rationale: "Without monitoring, issues stay invisible.",
        followUpIfNo:
          "Define basic metrics/alerts for errors and abuse patterns.",
      },
      {
        id: "log-2",
        prompt:
          "Is logging designed to avoid storing secrets or unnecessary personal data?",
        rationale: "Logs can become a sensitive data store.",
        followUpIfNo:
          "Review log fields; redact tokens, passwords, and raw PII.",
      },
    ],
  },
  {
    id: "evaluation",
    title: "Evaluation and testing",
    purpose: "Confirm you test behavior before and after changes.",
    items: [
      {
        id: "eval-1",
        prompt:
          "Is there a documented evaluation or test set for important behaviors?",
        rationale: "Untested changes regress quality and safety.",
        followUpIfNo:
          "Create a small regression set for critical prompts/tasks.",
      },
      {
        id: "eval-2",
        prompt: "Are major prompt/model changes re-tested before release?",
        rationale: "Behavioral changes need a release check.",
        followUpIfNo:
          "Add a pre-release checklist that includes re-running key tests.",
      },
    ],
  },
  {
    id: "incident",
    title: "Incident response",
    purpose: "Prepare for harmful outputs, leaks, or misuse when they happen.",
    items: [
      {
        id: "inc-1",
        prompt:
          "Is there a contact path to report harmful or unsafe AI behavior?",
        rationale: "Users and staff need a clear escalation route.",
        followUpIfNo:
          "Publish an internal/external report channel for AI incidents.",
      },
      {
        id: "inc-2",
        prompt:
          "Can the system be paused, rolled back, or rate-limited in an emergency?",
        rationale: "Containment options limit blast radius.",
        followUpIfNo: "Document kill-switch / rollback / rate-limit steps.",
      },
    ],
  },
  {
    id: "third-party",
    title: "Third-party dependencies",
    purpose: "Track vendors, models, and tools the system depends on.",
    items: [
      {
        id: "tp-1",
        prompt:
          "Is there an inventory of third-party models, APIs, and data providers?",
        rationale: "Vendor risk is part of system risk.",
        followUpIfNo:
          "Maintain a short dependency list with owners and contacts.",
      },
      {
        id: "tp-2",
        prompt:
          "Do you know where third-party providers may store or process data?",
        rationale: "Data residency and processing location affect risk.",
        followUpIfNo:
          "Record provider regions/processing notes from their docs.",
      },
    ],
  },
  {
    id: "limitations",
    title: "Known limitations",
    purpose: "Document failure modes so users and operators are not surprised.",
    items: [
      {
        id: "lim-1",
        prompt: "Are known failure modes or weak domains documented?",
        rationale: "Hidden limitations become user harm.",
        followUpIfNo:
          "Write a short “known limitations” note for operators/users.",
      },
      {
        id: "lim-2",
        prompt: "Is there a plan to revisit limitations after major changes?",
        rationale: "Limitations drift as the system changes.",
        followUpIfNo: "Schedule a periodic limitation review tied to releases.",
      },
    ],
  },
];

export function allItems() {
  return CHECKLIST_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ section, item })),
  );
}

export function findItem(itemId: string) {
  for (const section of CHECKLIST_SECTIONS) {
    const item = section.items.find((i) => i.id === itemId);
    if (item) return { section, item };
  }
  return null;
}

import type { ChecklistSectionDef } from "../governance-checklist/types";
import { nistRef } from "./source";

/**
 * Informal checklist aligned to NIST AI RMF 1.0 Core functions.
 * Items map to published subcategories; this is not an official NIST assessment.
 */
export const CHECKLIST_SECTIONS: ChecklistSectionDef[] = [
  {
    id: "govern",
    title: "GOVERN",
    purpose:
      "Check whether policies, accountability, culture, and third-party governance support AI risk management.",
    items: [
      {
        id: "gov-1",
        prompt:
          "Are AI-related legal/regulatory requirements understood and documented for your context?",
        rationale:
          "GOVERN starts with knowing which external requirements apply.",
        followUpIfNo:
          "Inventory applicable AI-related requirements and owners.",
        reference: nistRef(
          "GOVERN 1.1",
          "Legal and regulatory requirements involving AI",
        ),
      },
      {
        id: "gov-2",
        prompt:
          "Are roles and responsibilities for mapping, measuring, and managing AI risks documented?",
        rationale: "Clear ownership prevents risk work from stalling.",
        followUpIfNo:
          "Name owners for AI risk activities and escalation paths.",
        reference: nistRef(
          "GOVERN 2.1",
          "Roles and responsibilities for AI risk management",
        ),
      },
      {
        id: "gov-3",
        prompt: "Is there a maintained inventory of AI systems in scope?",
        rationale: "You cannot govern systems you have not listed.",
        followUpIfNo: "Create or update an AI system inventory with owners.",
        reference: nistRef("GOVERN 1.6", "Mechanisms to inventory AI systems"),
      },
      {
        id: "gov-4",
        prompt:
          "Are policies in place for AI risks from third-party models, data, or software?",
        rationale: "Supply-chain and vendor AI introduce shared risk.",
        followUpIfNo: "Document third-party AI risk review steps.",
        reference: nistRef("GOVERN 6.1", "Third-party AI risk policies"),
      },
    ],
  },
  {
    id: "map",
    title: "MAP",
    purpose:
      "Confirm context, intended use, system categorization, and mapped risks before measuring or treating them.",
    items: [
      {
        id: "map-1",
        prompt:
          "Are intended purposes, users, and deployment settings documented?",
        rationale: "Context frames which risks matter.",
        followUpIfNo: "Write an intended-use and deployment-context note.",
        reference: nistRef(
          "MAP 1.1",
          "Intended purposes and deployment context",
        ),
      },
      {
        id: "map-2",
        prompt:
          "Are organizational risk tolerances for this AI system documented?",
        rationale: "Tolerance guides go/no-go and treatment decisions.",
        followUpIfNo: "Record risk tolerance assumptions with decision owners.",
        reference: nistRef("MAP 1.5", "Organizational risk tolerances"),
      },
      {
        id: "map-3",
        prompt:
          "Are system tasks/methods and knowledge limits documented (including human oversight)?",
        rationale: "Operators need to know what the system can and cannot do.",
        followUpIfNo: "Document tasks, limits, and oversight expectations.",
        reference: nistRef(
          "MAP 2.2",
          "Knowledge limits and human oversight of outputs",
        ),
      },
      {
        id: "map-4",
        prompt:
          "Are risks from third-party components/data mapped and documented?",
        rationale: "Mapped component risk feeds later measure/manage work.",
        followUpIfNo: "Map third-party components and associated risks.",
        reference: nistRef(
          "MAP 4.1",
          "Mapping risks of AI components including third parties",
        ),
      },
    ],
  },
  {
    id: "measure",
    title: "MEASURE",
    purpose:
      "Check whether you evaluate, benchmark, and monitor AI risks and trustworthiness with documented methods.",
    items: [
      {
        id: "meas-1",
        prompt:
          "Are evaluation/test methods selected for the risks identified in MAP?",
        rationale: "Measurement should connect to mapped risks.",
        followUpIfNo: "Define tests or metrics tied to your top mapped risks.",
        reference: nistRef(
          "MEASURE 1.1",
          "Approaches and metrics for AI risk measurement",
        ),
      },
      {
        id: "meas-2",
        prompt:
          "Is system performance/assurance measured for conditions similar to deployment, with results documented?",
        rationale: "Lab-only checks can miss real deployment conditions.",
        followUpIfNo:
          "Run and document checks that reflect deployment settings.",
        reference: nistRef(
          "MEASURE 2.3",
          "Performance or assurance criteria measured for deployment-like conditions",
        ),
      },
      {
        id: "meas-3",
        prompt:
          "Are approaches in place to regularly track existing and emergent AI risks after release?",
        rationale: "Risk tracking must continue beyond the first evaluation.",
        followUpIfNo: "Define who tracks emergent risks and how often.",
        reference: nistRef(
          "MEASURE 3.1",
          "Regularly identify and track existing and emergent AI risks",
        ),
      },
      {
        id: "meas-4",
        prompt:
          "Is functionality/behavior monitored when the system is in production?",
        rationale: "Production monitoring catches drift and new failure modes.",
        followUpIfNo: "Add production monitoring for key AI behaviors.",
        reference: nistRef(
          "MEASURE 2.4",
          "Functionality and behavior monitored in production",
        ),
      },
    ],
  },
  {
    id: "manage",
    title: "MANAGE",
    purpose:
      "Confirm risks are prioritized, treated, communicated, and revisited - including residual and third-party risk.",
    items: [
      {
        id: "man-1",
        prompt:
          "Is treatment of documented AI risks prioritized by impact, likelihood, and resources?",
        rationale: "Without prioritization, response is ad hoc.",
        followUpIfNo: "Rank open AI risks and assign treatment owners.",
        reference: nistRef(
          "MANAGE 1.2",
          "Treatment of documented AI risks is prioritized",
        ),
      },
      {
        id: "man-2",
        prompt:
          "Can the system be superseded, disengaged, or deactivated if outcomes diverge from intended use?",
        rationale: "Containment options limit blast radius.",
        followUpIfNo: "Document deactivate/rollback ownership and steps.",
        reference: nistRef(
          "MANAGE 2.4",
          "Mechanisms to supersede, disengage, or deactivate AI systems",
        ),
      },
      {
        id: "man-3",
        prompt:
          "Are negative residual risks to acquirers/end users documented?",
        rationale: "Remaining risk should be explicit, not silent.",
        followUpIfNo: "Record residual risks and who accepted them.",
        reference: nistRef(
          "MANAGE 1.4",
          "Negative residual risks are documented",
        ),
      },
      {
        id: "man-4",
        prompt:
          "Are AI risks and benefits from third-party resources regularly monitored with controls applied?",
        rationale: "Vendor AI risk needs ongoing management.",
        followUpIfNo:
          "Monitor critical third-party AI dependencies and document controls.",
        reference: nistRef(
          "MANAGE 3.1",
          "Third-party AI risks and benefits regularly monitored",
        ),
      },
    ],
  },
];

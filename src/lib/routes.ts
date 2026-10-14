/**
 * Site navigation map - source of truth for mega menu + homepage.
 * Reserved tool paths are listed here but pages are omitted until the tool ships.
 * See docs/ROUTES.md.
 */

export type PlannedTool = {
  slug: string;
  /** Absolute path, e.g. /tools/work-hours */
  path: string;
  name: string;
  /** Short card / mega-menu description */
  blurb: string;
  status: "planned" | "live" | "stub";
};

export type Category = {
  id: string;
  name: string;
  blurb: string;
	/** Homepage category anchor, e.g. /#cat-work-hours */
	href: string;
  /** Accent tint for icons (decorative) */
  tint: string;
  tools: PlannedTool[];
};

export const categories: Category[] = [
  {
    id: "work-hours",
    name: "Work hours & shifts",
    blurb: "Hours, overtime, and shift totals without a spreadsheet.",
    href: "/#cat-work-hours",
    tint: "#0a7a6c",
    tools: [
      {
        slug: "work-hours",
        path: "/tools/work-hours",
        name: "Work hours calculator",
        blurb: "Day or week timesheets, breaks, overnight shifts, CSV export.",
        status: "live",
      },
    ],
  },
  {
    id: "photo-signature",
    name: "Photo & signature",
    blurb: "Prepare application photos and signatures in the browser.",
    href: "/#cat-photo-signature",
    tint: "#0b6e99",
    tools: [
      {
        slug: "image-resizer",
        path: "/tools/image-resizer",
        name: "Image resizer",
        blurb: "Set exact pixel size with optional aspect lock. Local only.",
        status: "live",
      },
      {
        slug: "image-compressor",
        path: "/tools/image-compressor",
        name: "Image compressor",
        blurb: "Lower file size with quality control and optional max KB.",
        status: "live",
      },
      {
        slug: "signature-formatter",
        path: "/tools/signature-formatter",
        name: "Signature formatter",
        blurb:
          "Crop and export signatures for forms - not an acceptance guarantee.",
        status: "live",
      },
    ],
  },
  {
    id: "files-media",
    name: "Files & media",
    blurb: "Light file helpers that stay on your device when claimed.",
    href: "/#cat-files-media",
    tint: "#c45c26",
    tools: [
      {
        slug: "merge-pdf",
        path: "/tools/merge-pdf",
        name: "PDF merger",
        blurb: "Combine PDFs in order, in your browser with pdf-lib.",
        status: "live",
      },
      {
        slug: "split-pdf",
        path: "/tools/split-pdf",
        name: "PDF splitter",
        blurb: "Extract page ranges into a new PDF. Local processing.",
        status: "live",
      },
    ],
  },
  {
    id: "business-finance",
    name: "Business & finance",
    blurb: "Everyday business and money calculators, fast and clear.",
    href: "/#cat-business-finance",
    tint: "#2f6b4f",
    tools: [
      {
        slug: "advertising-metrics",
        path: "/tools/advertising-metrics",
        name: "Advertising metrics",
        blurb: "CTR, CPC, CPA, ROAS and more from the numbers you enter.",
        status: "live",
      },
      {
        slug: "freelancer-rate",
        path: "/tools/freelancer-rate",
        name: "Freelancer rate",
        blurb: "Hourly and daily rate from income goals, costs, and hours.",
        status: "live",
      },
    ],
  },
  {
    id: "ai-governance",
    name: "AI governance",
    blurb: "Defensive self-check utilities for AI use and hygiene.",
    href: "/#cat-ai-governance",
    tint: "#3d4f6f",
    tools: [
      {
        slug: "ai-system-risk-checklist",
        path: "/tools/ai-system-risk-checklist",
        name: "AI system risk checklist",
        blurb:
          "Informal self-check for AI system hygiene - not a certification.",
        status: "live",
      },
      {
        slug: "nist-ai-rmf-checklist",
        path: "/tools/nist-ai-rmf-checklist",
        name: "NIST AI RMF checklist",
        blurb: "Aligned self-assessment prompts from AI RMF 1.0 language.",
        status: "live",
      },
      {
        slug: "owasp-llm-top10-checklist",
        path: "/tools/owasp-llm-top10-checklist",
        name: "OWASP LLM Top 10 checklist",
        blurb: "Control-focused review prompts - not attack guidance.",
        status: "live",
      },
    ],
  },
];

export function liveCategories(): Category[] {
  return categories
    .map((category) => ({
      ...category,
      tools: category.tools.filter((tool) => tool.status === "live"),
    }))
    .filter((category) => category.tools.length > 0);
}

export function liveTools() {
  return liveCategories().flatMap((category) =>
    category.tools.map((tool) => ({
      ...tool,
      categoryId: category.id,
      categoryName: category.name,
      tint: category.tint,
    })),
  );
}

/** Demo-only route - noindex, not linked from primary nav. */
export const TEMPLATE_DEMO_PATH = "/tools/template-demo";

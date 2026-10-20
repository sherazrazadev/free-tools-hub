/**
 * Guides content model (T08-05). One JSON file per guide in `src/content/guides/`.
 * Pure logic only - no Astro imports - so it is unit-tested in `guides.test.ts`.
 *
 * Publishing: a guide is live when `publishDate` <= today (UTC) at build time.
 * Add one file per day; a daily rebuild (see docs/GUIDES.md) publishes it.
 */

export type GuideStep = { title: string; body: string };
export type GuideFaq = { q: string; a: string };

export type Guide = {
	slug: string;
	/** Page H1. The <title> is "<title> | TommyTools", so keep this short. */
	title: string;
	/** Meta description (50-160 chars). */
	description: string;
	/** One-sentence lede under the H1. */
	lede: string;
	/** ISO date YYYY-MM-DD (UTC). Not shown before this day. */
	publishDate: string;
	/** Optional ISO date of the last meaningful edit. */
	updated?: string;
	/** Slug of exactly one live tool this guide leads to. */
	tool: string;
	/** The problem the reader has, in plain words. */
	problem: string;
	steps: GuideStep[];
	/** Optional worked example (plain text). */
	example?: string;
	limitations: string[];
	faq: GuideFaq[];
};

export const GUIDE_TITLE_MAX = 47; // + " | TommyTools" (13) keeps <title> within 60.
export const GUIDE_DESCRIPTION_MIN = 50;
export const GUIDE_DESCRIPTION_MAX = 160;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: unknown): value is string {
	if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
	const d = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function nonEmpty(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

/** Plain text only: guides are rendered as text, never as HTML. */
function plain(value: string): boolean {
	return !/[<>]/.test(value);
}

/**
 * Validate one guide object. Returns a list of problems (empty = valid).
 * `liveToolSlugs` is passed in so this file stays free of site imports.
 */
export function guideProblems(
	input: unknown,
	liveToolSlugs: readonly string[],
	fileSlug?: string,
): string[] {
	const out: string[] = [];
	if (typeof input !== 'object' || input === null) return ['not an object'];
	const g = input as Record<string, unknown>;

	if (!nonEmpty(g.slug) || !SLUG_RE.test(g.slug)) out.push('slug must be lowercase-kebab-case');
	else if (fileSlug && g.slug !== fileSlug) out.push(`slug "${g.slug}" must match file name "${fileSlug}"`);

	if (!nonEmpty(g.title)) out.push('title required');
	else if (g.title.length > GUIDE_TITLE_MAX) out.push(`title is ${g.title.length} chars (max ${GUIDE_TITLE_MAX})`);

	if (!nonEmpty(g.description)) out.push('description required');
	else if (g.description.length < GUIDE_DESCRIPTION_MIN || g.description.length > GUIDE_DESCRIPTION_MAX)
		out.push(`description is ${g.description.length} chars (${GUIDE_DESCRIPTION_MIN}-${GUIDE_DESCRIPTION_MAX})`);

	if (!nonEmpty(g.lede)) out.push('lede required');
	if (!nonEmpty(g.problem)) out.push('problem required');
	if (!isIsoDate(g.publishDate)) out.push('publishDate must be a real YYYY-MM-DD date');
	if (g.updated !== undefined && !isIsoDate(g.updated)) out.push('updated must be a real YYYY-MM-DD date');
	if (isIsoDate(g.publishDate) && isIsoDate(g.updated) && g.updated < g.publishDate)
		out.push('updated is before publishDate');

	if (!nonEmpty(g.tool) || !liveToolSlugs.includes(g.tool)) out.push(`tool "${String(g.tool)}" is not a live tool slug`);

	if (!Array.isArray(g.steps) || g.steps.length < 2) out.push('at least 2 steps');
	else
		g.steps.forEach((s, i) => {
			const step = s as Record<string, unknown>;
			if (!nonEmpty(step?.title) || !nonEmpty(step?.body)) out.push(`step ${i + 1} needs title and body`);
		});

	if (!Array.isArray(g.limitations) || g.limitations.length < 1 || !g.limitations.every(nonEmpty))
		out.push('at least 1 non-empty limitation');

	if (!Array.isArray(g.faq) || g.faq.length < 1) out.push('at least 1 FAQ entry');
	else
		g.faq.forEach((f, i) => {
			const item = f as Record<string, unknown>;
			if (!nonEmpty(item?.q) || !nonEmpty(item?.a)) out.push(`faq ${i + 1} needs q and a`);
		});

	if (g.example !== undefined && !nonEmpty(g.example)) out.push('example must be non-empty when present');

	// Plain-text check across every string we render.
	const strings: string[] = [];
	const walk = (v: unknown) => {
		if (typeof v === 'string') strings.push(v);
		else if (Array.isArray(v)) v.forEach(walk);
		else if (v && typeof v === 'object') Object.values(v).forEach(walk);
	};
	walk(g);
	if (strings.some((s) => !plain(s))) out.push('text must not contain < or > (plain text only)');

	return out;
}

export function todayUtc(now: Date = new Date()): string {
	return now.toISOString().slice(0, 10);
}

export function isPublished(guide: Pick<Guide, 'publishDate'>, today: string): boolean {
	return guide.publishDate <= today;
}

/** Newest first; ties broken by slug so output is stable. */
export function sortGuides<T extends Pick<Guide, 'publishDate' | 'slug'>>(guides: readonly T[]): T[] {
	return [...guides].sort((a, b) =>
		a.publishDate === b.publishDate ? a.slug.localeCompare(b.slug) : a.publishDate < b.publishDate ? 1 : -1,
	);
}

export function publishedGuides<T extends Pick<Guide, 'publishDate' | 'slug'>>(
	guides: readonly T[],
	today: string,
): T[] {
	return sortGuides(guides.filter((g) => isPublished(g, today)));
}

export function formatGuideDate(iso: string): string {
	const d = new Date(`${iso}T00:00:00Z`);
	return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

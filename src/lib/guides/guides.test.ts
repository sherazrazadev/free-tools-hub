import { describe, expect, it } from 'vitest';
import { liveTools } from '../routes';
import { MAX_PDF_BYTES, MAX_PDF_FILES, MAX_TOTAL_PDF_BYTES, bytesToMbFloor } from '../tools/pdf/limits';
import { allGuides, getPublishedGuides, getPublishedGuidesForTool } from './index';
import {
	GUIDE_TITLE_MAX,
	guideProblems,
	isPublished,
	publishedGuides,
	sortGuides,
	todayUtc,
	type Guide,
} from './guides';

const live = liveTools().map((t) => t.slug);

const base: Guide = {
	slug: 'sample-guide',
	title: 'How to do a sample thing',
	description: 'A sample description that is long enough to pass the length check for guides.',
	lede: 'Lede.',
	publishDate: '2026-10-20',
	tool: 'work-hours',
	problem: 'Problem.',
	steps: [
		{ title: 'One', body: 'First.' },
		{ title: 'Two', body: 'Second.' },
	],
	limitations: ['A limit.'],
	faq: [{ q: 'Q?', a: 'A.' }],
};

describe('guideProblems', () => {
	it('accepts a valid guide', () => {
		expect(guideProblems(base, live, 'sample-guide')).toEqual([]);
	});

	it('rejects bad slug, file mismatch, unknown tool, bad date', () => {
		expect(guideProblems({ ...base, slug: 'Bad Slug' }, live)).toContain('slug must be lowercase-kebab-case');
		expect(guideProblems(base, live, 'other-file').join()).toMatch(/must match file name/);
		expect(guideProblems({ ...base, tool: 'nope' }, live).join()).toMatch(/not a live tool slug/);
		expect(guideProblems({ ...base, publishDate: '2026-02-31' }, live).join()).toMatch(/publishDate/);
		expect(guideProblems({ ...base, publishDate: '10/20/2026' }, live).join()).toMatch(/publishDate/);
	});

	it('rejects over-long title, short description, thin content, HTML', () => {
		expect(guideProblems({ ...base, title: 'x'.repeat(GUIDE_TITLE_MAX + 1) }, live).join()).toMatch(/title is/);
		expect(guideProblems({ ...base, description: 'too short' }, live).join()).toMatch(/description is/);
		expect(guideProblems({ ...base, steps: [base.steps[0]] }, live).join()).toMatch(/at least 2 steps/);
		expect(guideProblems({ ...base, limitations: [] }, live).join()).toMatch(/limitation/);
		expect(guideProblems({ ...base, faq: [] }, live).join()).toMatch(/FAQ/);
		expect(guideProblems({ ...base, lede: 'Click <b>here</b>' }, live).join()).toMatch(/plain text/);
	});

	it('rejects updated before publishDate', () => {
		expect(guideProblems({ ...base, updated: '2026-10-01' }, live).join()).toMatch(/updated is before/);
	});
});

describe('publishing by date', () => {
	const a = { slug: 'a', publishDate: '2026-10-20' };
	const b = { slug: 'b', publishDate: '2026-10-21' };
	const c = { slug: 'c', publishDate: '2026-10-21' };

	it('publishes on the day, not before', () => {
		expect(isPublished(a, '2026-10-19')).toBe(false);
		expect(isPublished(a, '2026-10-20')).toBe(true);
		expect(isPublished(a, '2026-12-01')).toBe(true);
	});

	it('sorts newest first, ties by slug, and filters unpublished', () => {
		expect(sortGuides([a, c, b]).map((g) => g.slug)).toEqual(['b', 'c', 'a']);
		expect(publishedGuides([a, b, c], '2026-10-20').map((g) => g.slug)).toEqual(['a']);
		expect(publishedGuides([a, b, c], '2026-10-21').map((g) => g.slug)).toEqual(['b', 'c', 'a']);
	});

	it('uses the UTC date', () => {
		expect(todayUtc(new Date('2026-10-20T23:30:00-04:00'))).toBe('2026-10-21');
	});
});

describe('shipped guides (T08-05 / T08-06)', () => {
	it('loads at least the three planned guides, each leading to a live tool', () => {
		expect(allGuides.length).toBeGreaterThanOrEqual(3);
		const tools = allGuides.map((g) => g.tool);
		expect(new Set(tools).size).toBeGreaterThanOrEqual(3);
		for (const tool of tools) expect(live).toContain(tool);
	});

	it('unique slugs and unique titles', () => {
		expect(new Set(allGuides.map((g) => g.slug)).size).toBe(allGuides.length);
		expect(new Set(allGuides.map((g) => g.title)).size).toBe(allGuides.length);
	});

	it('<title> stays within 60 characters', () => {
		for (const g of allGuides) expect(`${g.title} | TommyTools`.length).toBeLessThanOrEqual(60);
	});

	it('only published guides are exposed, and per tool lookups agree', () => {
		const before = new Date('2000-01-01T00:00:00Z');
		expect(getPublishedGuides(before)).toEqual([]);
		const far = new Date('2099-01-01T00:00:00Z');
		expect(getPublishedGuides(far).length).toBe(allGuides.length);
		for (const g of allGuides) expect(getPublishedGuidesForTool(g.tool, far).map((x) => x.slug)).toContain(g.slug);
	});

	it('merge-pdf guide quotes the same limits as the tool', () => {
		const guide = allGuides.find((g) => g.tool === 'merge-pdf')!;
		const text = guide.limitations.join(' ');
		expect(text).toContain(`${bytesToMbFloor(MAX_PDF_BYTES)} MB per PDF`);
		expect(text).toContain(`${MAX_PDF_FILES} files`);
		expect(text).toContain(`${bytesToMbFloor(MAX_TOTAL_PDF_BYTES)} MB combined`);
	});
});

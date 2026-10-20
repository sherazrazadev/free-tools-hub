import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { liveTools } from '../routes';

const root = resolve(import.meta.dirname, '../../..');

const tools = liveTools().map((tool) => {
	const src = readFileSync(resolve(root, `src/pages${tool.path}.astro`), 'utf8');
	const attr = (name: string) => src.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
	const related = [...(src.match(/slot="related"[\s\S]*?<\/div>/)?.[0] ?? '').matchAll(/href="([^"]+)"/g)].map(
		(m) => m[1].replace(/\/$/, ''),
	);
	return {
		path: tool.path,
		src,
		title: attr('title'),
		description: attr('description'),
		heading: attr('heading'),
		purpose: attr('purpose'),
		related,
	};
});

describe('T08-03 on-page checklist per live tool', () => {
	it('has unique titles', () => {
		const titles = tools.map((t) => t.title);
		expect(new Set(titles).size).toBe(titles.length);
	});

	it('has a unique meta description of 50-160 characters', () => {
		const seen = new Set<string>();
		for (const t of tools) {
			expect(t.description, `${t.path}: no description`).toBeTruthy();
			const len = t.description!.length;
			expect(len, `${t.path}: description is ${len} chars`).toBeGreaterThanOrEqual(50);
			expect(len, `${t.path}: description is ${len} chars`).toBeLessThanOrEqual(160);
			expect(seen.has(t.description!), `${t.path}: duplicate description`).toBe(false);
			seen.add(t.description!);
		}
	});

	it('has one heading and a purpose line (H1 comes from ToolLayout)', () => {
		for (const t of tools) {
			expect(t.heading, `${t.path}: no heading`).toBeTruthy();
			expect(t.purpose, `${t.path}: no purpose`).toBeTruthy();
			expect(t.src, `${t.path}: extra <h1> in page`).not.toMatch(/<h1[\s>]/);
		}
		const layout = readFileSync(resolve(root, 'src/layouts/ToolLayout.astro'), 'utf8');
		expect(layout.match(/<h1[\s>]/g)).toHaveLength(1);
	});

	it('puts a hydrated tool in the tool slot', () => {
		for (const t of tools) {
			expect(t.src, `${t.path}: no tool slot`).toMatch(/slot="tool"[\s\S]*?client:load/);
		}
	});

	it('has an example, limitations and related slot', () => {
		for (const t of tools) {
			for (const slot of ['example', 'limitations', 'related']) {
				expect(t.src, `${t.path}: missing slot="${slot}"`).toContain(`slot="${slot}"`);
			}
		}
	});

	it('has non-empty limitations and example text', () => {
		for (const t of tools) {
			for (const slot of ['example', 'limitations']) {
				const block = t.src.match(new RegExp(`slot="${slot}"[\\s\\S]*?\\n\\t</div>`))?.[0] ?? '';
				const text = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
				expect(text.length, `${t.path}: ${slot} is too short`).toBeGreaterThan(80);
			}
		}
	});
});

describe('T08-04 internal linking', () => {
	const live = new Set(tools.map((t) => t.path));

	it('related links point at other live tools only', () => {
		for (const t of tools) {
			expect(t.related.length, `${t.path}: no related links`).toBeGreaterThan(0);
			for (const href of t.related) {
				expect(live.has(href), `${t.path} links to ${href}`).toBe(true);
				expect(href, `${t.path} links to itself`).not.toBe(t.path);
			}
		}
	});

	it('every live tool is linked from at least one other tool page', () => {
		const inbound = new Map<string, number>(tools.map((t) => [t.path, 0]));
		for (const t of tools) for (const href of new Set(t.related)) inbound.set(href, (inbound.get(href) ?? 0) + 1);
		for (const [path, n] of inbound) expect(n, `${path} has no inbound related links`).toBeGreaterThan(0);
	});

	it('home page renders every live tool from the route map', () => {
		const home = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
		expect(home).toContain('liveTools()');
		expect(home).toMatch(/tools\.map\(/);
	});

	it('expected tool clusters link to each other', () => {
		const rel = (p: string) => tools.find((t) => t.path === p)?.related ?? [];
		const pairs: Array<[string, string]> = [
			['/tools/merge-pdf', '/tools/split-pdf'],
			['/tools/split-pdf', '/tools/merge-pdf'],
			['/tools/image-resizer', '/tools/image-compressor'],
			['/tools/image-compressor', '/tools/image-resizer'],
			['/tools/advertising-metrics', '/tools/freelancer-rate'],
			['/tools/freelancer-rate', '/tools/advertising-metrics'],
		];
		for (const [from, to] of pairs) {
			if (!live.has(from) || !live.has(to)) continue;
			expect(rel(from), `${from} -> ${to}`).toContain(to);
		}
	});
});

describe('T08-08 heavy libraries stay lazy', () => {
	it('PDF tool islands import pdf-lib code only on demand', () => {
		const heavy = /^import\s+(?!type\b).*from\s+['"][^'"]*\/(pdf\/document|merge-pdf\/merge|split-pdf\/split)['"]/m;
		for (const file of ['MergePdfTool.tsx', 'SplitPdfTool.tsx']) {
			const src = readFileSync(resolve(root, `src/components/tools/${file}`), 'utf8');
			expect(src, `${file} imports pdf-lib code statically`).not.toMatch(heavy);
			expect(src).not.toMatch(/from\s+['"]pdf-lib['"]/);
		}
	});

	it('non-PDF tools never import pdf-lib', () => {
		for (const t of tools) {
			if (t.path.endsWith('-pdf')) continue;
			expect(t.src).not.toContain('pdf-lib');
		}
	});
});

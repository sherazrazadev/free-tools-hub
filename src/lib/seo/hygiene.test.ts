import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toolFaqGroups } from '../faq';
import { liveTools, TEMPLATE_DEMO_PATH } from '../routes';

const root = resolve(import.meta.dirname, '../../..');

describe('T08-01 production hygiene', () => {
	it('every live tool has a page file', () => {
		for (const tool of liveTools()) {
			const file = resolve(root, `src/pages${tool.path}.astro`);
			expect(existsSync(file), `missing page for ${tool.path}`).toBe(true);
		}
	});

	it('FAQ groups only link to live tools', () => {
		const live = new Set(liveTools().map((t) => t.path));
		for (const group of toolFaqGroups) {
			expect(live.has(group.path), `FAQ path not live: ${group.path}`).toBe(true);
		}
	});

	it('template demo stays a stub path constant', () => {
		expect(TEMPLATE_DEMO_PATH).toBe('/tools/template-demo');
		expect(existsSync(resolve(root, 'src/pages/tools/template-demo.astro'))).toBe(true);
	});

	it('sitemap filter excludes stub and categories redirect', () => {
		const config = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8');
		expect(config).toContain('/tools/template-demo');
		expect(config).toContain('/categories');
	});

	it('robots disallows template demo', () => {
		const robots = readFileSync(resolve(root, 'public/robots.txt'), 'utf8');
		expect(robots).toMatch(/Disallow:\s*\/tools\/template-demo/);
		expect(robots).toContain('Sitemap: https://tools.tommyfx.pk/sitemap-index.xml');
	});
});

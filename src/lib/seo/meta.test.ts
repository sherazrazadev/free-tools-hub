import { describe, expect, it } from 'vitest';
import { buildPageMeta, canonicalUrl, truncateDescription } from './meta';

describe('canonicalUrl', () => {
	it('adds a trailing slash for the homepage', () => {
		expect(canonicalUrl('/')).toBe('https://tools.tommyfx.pk/');
	});

	it('normalizes nested paths with a trailing slash', () => {
		expect(canonicalUrl('/about')).toBe('https://tools.tommyfx.pk/about/');
		expect(canonicalUrl('/about/')).toBe('https://tools.tommyfx.pk/about/');
	});
});

describe('truncateDescription', () => {
	it('leaves short text unchanged', () => {
		expect(truncateDescription('Short description.')).toBe('Short description.');
	});

	it('truncates long text near a word boundary', () => {
		const long = 'Word '.repeat(50).trim();
		const out = truncateDescription(long, 40);
		expect(out.endsWith('…')).toBe(true);
		expect(out.length).toBeLessThanOrEqual(40);
	});
});

describe('buildPageMeta', () => {
	it('marks stubs as noindex', () => {
		const meta = buildPageMeta({
			pathname: '/tools/template-demo',
			noindex: true,
		});
		expect(meta.robots).toBe('noindex, nofollow');
		expect(meta.og.url).toBe('https://tools.tommyfx.pk/tools/template-demo/');
	});

	it('includes an absolute square share image for OG and Twitter', () => {
		const meta = buildPageMeta({ pathname: '/about' });
		expect(meta.og.image).toBe('https://tools.tommyfx.pk/brand/tommytools-icon.jpg');
		expect(meta.twitter.image).toBe(meta.og.image);
		expect(meta.og.imageWidth).toBe(meta.og.imageHeight);
		expect(meta.og.imageAlt.length).toBeGreaterThan(0);
	});
});

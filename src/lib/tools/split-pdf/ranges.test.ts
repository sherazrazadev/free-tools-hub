import { describe, expect, it } from 'vitest';
import { formatSelectedPages, parsePageRanges } from './ranges';

describe('parsePageRanges', () => {
	it('parses singles and ranges (1-based)', () => {
		const r = parsePageRanges('1-3,5,7-8', 10);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.indices).toEqual([0, 1, 2, 4, 6, 7]);
	});

	it('dedupes overlapping selections preserving first order', () => {
		const r = parsePageRanges('2,1-3', 5);
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.indices).toEqual([1, 0, 2]);
	});

	it('rejects empty input', () => {
		const r = parsePageRanges('  ', 5);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('empty');
	});

	it('rejects bad syntax', () => {
		const r = parsePageRanges('1-3-5', 5);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('syntax');
	});

	it('rejects start > end', () => {
		const r = parsePageRanges('5-2', 10);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('syntax');
	});

	it('rejects out of bounds', () => {
		const r = parsePageRanges('1-4', 3);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('bounds');
	});

	it('rejects page 0', () => {
		const r = parsePageRanges('0', 3);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('syntax');
	});
});

describe('formatSelectedPages', () => {
	it('formats 1-based labels', () => {
		expect(formatSelectedPages([0, 2, 4])).toBe('1, 3, 5');
	});
});

import { describe, expect, it } from 'vitest';
import {
	computeOutputDimensions,
	defaultTargets,
	MAX_OUTPUT_EDGE,
	outputSizeProblem,
	parsePixelField,
} from './dimensions';

describe('computeOutputDimensions', () => {
	it('uses exact width/height when aspect unlocked', () => {
		expect(
			computeOutputDimensions({
				sourceWidth: 800,
				sourceHeight: 600,
				targetWidth: 400,
				targetHeight: 200,
				lockAspect: false,
			}),
		).toEqual({ width: 400, height: 200 });
	});

	it('preserves aspect when driven by width', () => {
		expect(
			computeOutputDimensions({
				sourceWidth: 800,
				sourceHeight: 600,
				targetWidth: 400,
				targetHeight: 999,
				lockAspect: true,
				drive: 'width',
			}),
		).toEqual({ width: 400, height: 300 });
	});

	it('preserves aspect when driven by height', () => {
		expect(
			computeOutputDimensions({
				sourceWidth: 800,
				sourceHeight: 600,
				targetWidth: 999,
				targetHeight: 150,
				lockAspect: true,
				drive: 'height',
			}),
		).toEqual({ width: 200, height: 150 });
	});

	it('floors to at least 1px', () => {
		expect(
			computeOutputDimensions({
				sourceWidth: 10,
				sourceHeight: 10,
				targetWidth: 0,
				targetHeight: 0,
				lockAspect: false,
			}),
		).toEqual({ width: 1, height: 1 });
	});
});

describe('defaultTargets', () => {
	it('returns source size when under max edge', () => {
		expect(defaultTargets(640, 480)).toEqual({ width: 640, height: 480 });
	});

	it('scales down when over max edge', () => {
		const d = defaultTargets(8000, 4000, 4000);
		expect(d.width).toBe(4000);
		expect(d.height).toBe(2000);
	});
});

describe('outputSizeProblem', () => {
	it('accepts normal sizes', () => {
		expect(outputSizeProblem(800, 600)).toBeNull();
		expect(outputSizeProblem(MAX_OUTPUT_EDGE, 1000)).toBeNull();
	});

	it('rejects zero, NaN, and oversize edges', () => {
		expect(outputSizeProblem(0, 100)).toMatch(/at least 1/);
		expect(outputSizeProblem(Number.NaN, 100)).toMatch(/at least 1/);
		expect(outputSizeProblem(MAX_OUTPUT_EDGE + 1, 10)).toMatch(/8192/);
	});

	it('rejects totals above the pixel budget', () => {
		expect(outputSizeProblem(8000, 8000)).toMatch(/too large/);
	});
});

describe('parsePixelField', () => {
	it('returns null for empty or invalid text so the field can be cleared', () => {
		expect(parsePixelField('')).toBeNull();
		expect(parsePixelField('   ')).toBeNull();
		expect(parsePixelField('abc')).toBeNull();
		expect(parsePixelField('0')).toBeNull();
		expect(parsePixelField('-5')).toBeNull();
	});

	it('floors valid numbers', () => {
		expect(parsePixelField('640')).toBe(640);
		expect(parsePixelField('640.9')).toBe(640);
	});
});

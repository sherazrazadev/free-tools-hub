import { describe, expect, it } from 'vitest';
import { computeOutputDimensions, defaultTargets } from './dimensions';

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

import { describe, expect, it } from 'vitest';
import {
	MIN_QUALITY,
	buildEncodePlan,
	bytesToKbLabel,
	clampQuality,
	reductionPercent,
} from './plan';

describe('clampQuality', () => {
	it('clamps and defaults', () => {
		expect(clampQuality(0.85)).toBe(0.85);
		expect(clampQuality(2)).toBe(1);
		expect(clampQuality(0)).toBe(MIN_QUALITY);
		expect(clampQuality(Number.NaN)).toBe(0.85);
	});
});

describe('buildEncodePlan', () => {
	it('single attempt when no max bytes', () => {
		const plan = buildEncodePlan({
			sourceWidth: 1000,
			sourceHeight: 800,
			startQuality: 0.9,
			format: 'image/jpeg',
			maxBytes: null,
		});
		expect(plan).toHaveLength(1);
		expect(plan[0]).toMatchObject({
			width: 1000,
			height: 800,
			quality: 0.9,
			scale: 1,
			type: 'image/jpeg',
		});
	});

	it('includes quality then scale steps when max set', () => {
		const plan = buildEncodePlan({
			sourceWidth: 200,
			sourceHeight: 100,
			startQuality: 0.2,
			format: 'image/webp',
			maxBytes: 50 * 1024,
		});
		expect(plan[0]).toMatchObject({
			quality: 0.2,
			scale: 1,
			width: 200,
			height: 100,
		});
		expect(plan.some((p) => p.quality === MIN_QUALITY && p.scale === 1)).toBe(true);
		expect(plan.some((p) => p.scale === 0.5)).toBe(true);
		const half = plan.find((p) => p.scale === 0.5 && p.quality === 0.2);
		expect(half).toMatchObject({ width: 100, height: 50 });
	});
});

describe('labels', () => {
	it('formats KB and reduction', () => {
		expect(bytesToKbLabel(1536)).toBe('1.5 KB');
		expect(bytesToKbLabel(20 * 1024)).toBe('20 KB');
		expect(reductionPercent(1000, 750)).toBe(25);
		expect(reductionPercent(0, 10)).toBeNull();
	});
});

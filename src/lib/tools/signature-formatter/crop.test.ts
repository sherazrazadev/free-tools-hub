import { describe, expect, it } from 'vitest';
import {
	clampCropRect,
	cropToNormalized,
	fullCrop,
	normalizedToCrop,
} from './crop';

describe('crop helpers', () => {
	it('fullCrop matches source', () => {
		expect(fullCrop(640, 200)).toEqual({ x: 0, y: 0, width: 640, height: 200 });
	});

	it('clamps overflow', () => {
		expect(
			clampCropRect({ x: -10, y: 50, width: 1000, height: 1000 }, 400, 300),
		).toEqual({ x: 0, y: 0, width: 400, height: 300 });
	});

	it('round-trips normalized crop', () => {
		const rect = { x: 40, y: 20, width: 200, height: 80 };
		const n = cropToNormalized(rect, 400, 200);
		expect(normalizedToCrop(n, 400, 200)).toEqual(rect);
	});
});

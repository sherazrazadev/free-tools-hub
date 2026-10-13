import type { CompressFormat, EncodeParams } from './types';

export const MIN_QUALITY = 0.1;
export const QUALITY_STEP = 0.05;
export const SCALE_STEPS = [1, 0.9, 0.8, 0.7, 0.6, 0.5] as const;

/** Clamp UI quality (0–1) into a usable encoder range. */
export function clampQuality(quality: number): number {
	if (!Number.isFinite(quality)) return 0.85;
	return Math.min(1, Math.max(MIN_QUALITY, quality));
}

/**
 * Ordered encode attempts: quality ladder at each scale, then smaller scales.
 * Without a max-byte target, returns a single full-size attempt.
 */
export function buildEncodePlan(input: {
	sourceWidth: number;
	sourceHeight: number;
	startQuality: number;
	format: CompressFormat;
	maxBytes: number | null;
}): EncodeParams[] {
	const sw = Math.max(1, Math.floor(input.sourceWidth));
	const sh = Math.max(1, Math.floor(input.sourceHeight));
	const startQ = clampQuality(input.startQuality);
	const format = input.format;

	if (input.maxBytes === null || input.maxBytes <= 0) {
		return [
			{
				width: sw,
				height: sh,
				quality: startQ,
				type: format,
				scale: 1,
			},
		];
	}

	const qualities: number[] = [];
	for (let q = startQ; q >= MIN_QUALITY - 1e-9; q -= QUALITY_STEP) {
		qualities.push(Math.round(q * 100) / 100);
	}
	if (qualities[qualities.length - 1] !== MIN_QUALITY) {
		qualities.push(MIN_QUALITY);
	}

	const plan: EncodeParams[] = [];
	for (const scale of SCALE_STEPS) {
		const width = Math.max(1, Math.round(sw * scale));
		const height = Math.max(1, Math.round(sh * scale));
		for (const quality of qualities) {
			plan.push({ width, height, quality, type: format, scale });
		}
	}
	return plan;
}

export function formatExt(format: CompressFormat): string {
	return format === 'image/webp' ? 'webp' : 'jpg';
}

export function bytesToKbLabel(bytes: number): string {
	const kb = bytes / 1024;
	if (kb < 10) return `${kb.toFixed(1)} KB`;
	return `${Math.round(kb)} KB`;
}

export function reductionPercent(originalBytes: number, outputBytes: number): number | null {
	if (originalBytes <= 0) return null;
	return Math.round(((originalBytes - outputBytes) / originalBytes) * 1000) / 10;
}

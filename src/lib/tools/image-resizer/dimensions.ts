import type { OutputDimensions } from './types';

/**
 * Resolve output pixel size from requested width/height and optional aspect lock.
 * When locked, the dimension the user last edited drives the other side.
 */
export function computeOutputDimensions(input: {
	sourceWidth: number;
	sourceHeight: number;
	targetWidth: number;
	targetHeight: number;
	lockAspect: boolean;
	/** Which field the user changed when lock is on. */
	drive?: 'width' | 'height';
}): OutputDimensions {
	const sw = Math.max(1, Math.floor(input.sourceWidth));
	const sh = Math.max(1, Math.floor(input.sourceHeight));
	let w = Math.max(1, Math.floor(input.targetWidth));
	let h = Math.max(1, Math.floor(input.targetHeight));

	if (!input.lockAspect) {
		return { width: w, height: h };
	}

	const ratio = sw / sh;
	const drive = input.drive ?? 'width';

	if (drive === 'height') {
		h = Math.max(1, Math.floor(input.targetHeight));
		w = Math.max(1, Math.round(h * ratio));
	} else {
		w = Math.max(1, Math.floor(input.targetWidth));
		h = Math.max(1, Math.round(w / ratio));
	}

	return { width: w, height: h };
}

/** Longest side a browser canvas can reliably encode (Safari/iOS fails well above this). */
export const MAX_OUTPUT_EDGE = 8192;
/** Total pixel budget (about 8000x6000); iOS Safari caps canvas area near 16.7 MP. */
export const MAX_OUTPUT_PIXELS = 48_000_000;

/**
 * Returns a user-facing message when the requested output is too large for a
 * browser canvas, or null when it is safe to render.
 */
export function outputSizeProblem(width: number, height: number): string | null {
	if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
		return 'Enter a width and height of at least 1 pixel.';
	}
	if (width > MAX_OUTPUT_EDGE || height > MAX_OUTPUT_EDGE) {
		return `Each side must be ${MAX_OUTPUT_EDGE} px or less.`;
	}
	if (width * height > MAX_OUTPUT_PIXELS) {
		return 'That output is too large for a browser to render. Use smaller dimensions.';
	}
	return null;
}

/**
 * Parse a text field into a whole pixel count. Empty or invalid text returns
 * null so the field can stay empty while the user is typing.
 */
export function parsePixelField(raw: string): number | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const n = Math.floor(Number(trimmed));
	return Number.isFinite(n) && n >= 1 ? n : null;
}

/** Default targets = source size (clamped to sane max for UI defaults). */
export function defaultTargets(
	sourceWidth: number,
	sourceHeight: number,
	maxEdge = 4096,
): OutputDimensions {
	const sw = Math.max(1, Math.floor(sourceWidth));
	const sh = Math.max(1, Math.floor(sourceHeight));
	const scale = Math.min(1, maxEdge / Math.max(sw, sh));
	return {
		width: Math.max(1, Math.round(sw * scale)),
		height: Math.max(1, Math.round(sh * scale)),
	};
}

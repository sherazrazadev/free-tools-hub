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

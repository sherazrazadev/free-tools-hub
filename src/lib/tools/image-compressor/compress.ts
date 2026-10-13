import { buildEncodePlan } from './plan';
import type { CompressFormat, CompressOutcome, EncodeFn } from './types';

/**
 * Iteratively encode until under maxBytes (when set), or once at start quality.
 * Never claims the limit was met when it was not.
 */
export async function compressImage(input: {
	sourceWidth: number;
	sourceHeight: number;
	originalBytes: number;
	startQuality: number;
	format: CompressFormat;
	/** Target size in bytes; null = no KB target. */
	maxBytes: number | null;
	encode: EncodeFn;
}): Promise<CompressOutcome> {
	const plan = buildEncodePlan({
		sourceWidth: input.sourceWidth,
		sourceHeight: input.sourceHeight,
		startQuality: input.startQuality,
		format: input.format,
		maxBytes: input.maxBytes,
	});

	let best: CompressOutcome | null = null;
	let attempts = 0;

	for (const step of plan) {
		attempts += 1;
		const blob = await input.encode(step);
		const outputBytes = blob.size;
		const metLimit =
			input.maxBytes === null || input.maxBytes <= 0
				? true
				: outputBytes <= input.maxBytes;

		const candidate: CompressOutcome = {
			blob,
			width: step.width,
			height: step.height,
			quality: step.quality,
			scale: step.scale,
			format: input.format,
			originalBytes: input.originalBytes,
			outputBytes,
			maxBytes: input.maxBytes !== null && input.maxBytes > 0 ? input.maxBytes : null,
			metLimit,
			attempts,
			message: null,
		};

		if (!best || outputBytes < best.outputBytes) {
			best = candidate;
		}

		if (metLimit && input.maxBytes !== null && input.maxBytes > 0) {
			return {
				...candidate,
				message: null,
			};
		}

		if (input.maxBytes === null || input.maxBytes <= 0) {
			return candidate;
		}
	}

	if (!best) {
		throw new Error('Compression produced no output.');
	}

	return {
		...best,
		metLimit: false,
		attempts,
		message:
			'Could not reach the target file size with the tried quality and scale steps. Download shows the smallest attempt; try a lower starting quality, WebP, or a larger KB limit.',
	};
}

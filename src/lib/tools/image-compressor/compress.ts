import { buildEncodePlan } from './plan';
import type { CompressFormat, CompressOutcome, EncodeFn, EncodeParams } from './types';

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

	const tracker: { best: CompressOutcome | null } = { best: null };
	let attempts = 0;
	const hasTarget = input.maxBytes !== null && input.maxBytes > 0;

	const run = async (step: EncodeParams): Promise<CompressOutcome> => {
		attempts += 1;
		const blob = await input.encode(step);
		const outputBytes = blob.size;
		const candidate: CompressOutcome = {
			blob,
			width: step.width,
			height: step.height,
			quality: step.quality,
			scale: step.scale,
			format: input.format,
			originalBytes: input.originalBytes,
			outputBytes,
			maxBytes: hasTarget ? input.maxBytes : null,
			metLimit: !hasTarget || outputBytes <= (input.maxBytes as number),
			attempts,
			message: null,
		};
		if (!tracker.best || outputBytes < tracker.best.outputBytes) tracker.best = candidate;
		return candidate;
	};

	if (!hasTarget) {
		return run(plan[0]);
	}

	// Group the ladder by scale. At each scale, try the lowest quality first:
	// if even that is too big, the rest of the ladder at this scale cannot fit,
	// so skip it. Otherwise search for the best quality that fits.
	const groups = new Map<number, EncodeParams[]>();
	for (const step of plan) {
		const list = groups.get(step.scale) ?? [];
		list.push(step);
		groups.set(step.scale, list);
	}

	for (const steps of groups.values()) {
		const lastIndex = steps.length - 1;
		const floorResult = await run(steps[lastIndex]);
		if (!floorResult.metLimit) continue;

		// Size shrinks as quality drops, so binary-search the ladder for the
		// highest quality that still fits (about log2(steps) encodes).
		let lo = 0;
		let hi = lastIndex;
		let winner = floorResult;
		while (lo < hi) {
			const mid = Math.floor((lo + hi) / 2);
			const result = await run(steps[mid]);
			if (result.metLimit) {
				winner = result;
				hi = mid;
			} else {
				lo = mid + 1;
			}
		}
		return { ...winner, attempts, message: null };
	}

	const best = tracker.best;
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

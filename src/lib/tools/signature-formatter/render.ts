import { canvasToBlob } from '../image-resizer/canvasResize';
import { compressImage } from '../image-compressor/compress';
import type { CompressFormat } from '../image-compressor/types';
import type { CropRect } from './crop';
import { clampCropRect } from './crop';
import { applyLuminanceThreshold } from './threshold';

export type SignatureFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export type SignatureRenderResult = {
	blob: Blob;
	width: number;
	height: number;
	outputBytes: number;
	metLimit: boolean;
	maxBytes: number | null;
	message: string | null;
	quality: number;
	scale: number;
	attempts: number;
};

/**
 * Draw crop → output size on a plain background (JPEG/WebP always; PNG uses fill too for consistent preview).
 */
export function drawSignatureCanvas(input: {
	source: CanvasImageSource;
	crop: CropRect;
	sourceWidth: number;
	sourceHeight: number;
	outWidth: number;
	outHeight: number;
	background: string;
	threshold: number | null;
}): HTMLCanvasElement {
	const crop = clampCropRect(input.crop, input.sourceWidth, input.sourceHeight);
	const w = Math.max(1, Math.floor(input.outWidth));
	const h = Math.max(1, Math.floor(input.outHeight));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D is not available in this browser.');

	ctx.fillStyle = input.background;
	ctx.fillRect(0, 0, w, h);
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(
		input.source,
		crop.x,
		crop.y,
		crop.width,
		crop.height,
		0,
		0,
		w,
		h,
	);

	if (input.threshold !== null) {
		const data = ctx.getImageData(0, 0, w, h);
		ctx.putImageData(applyLuminanceThreshold(data, input.threshold), 0, 0);
	}

	return canvas;
}

export function formatExt(format: SignatureFormat): string {
	if (format === 'image/png') return 'png';
	if (format === 'image/webp') return 'webp';
	return 'jpg';
}

/**
 * Crop, resize, optional threshold, encode; iterative max-KB when requested.
 */
export async function formatSignature(input: {
	source: CanvasImageSource;
	crop: CropRect;
	sourceWidth: number;
	sourceHeight: number;
	outWidth: number;
	outHeight: number;
	format: SignatureFormat;
	background: string;
	threshold: number | null;
	startQuality: number;
	originalBytes: number;
	maxBytes: number | null;
}): Promise<SignatureRenderResult> {
	const baseW = Math.max(1, Math.floor(input.outWidth));
	const baseH = Math.max(1, Math.floor(input.outHeight));

	const encodeAt = async (width: number, height: number, quality: number) => {
		const canvas = drawSignatureCanvas({
			source: input.source,
			crop: input.crop,
			sourceWidth: input.sourceWidth,
			sourceHeight: input.sourceHeight,
			outWidth: width,
			outHeight: height,
			background: input.background,
			threshold: input.threshold,
		});
		if (input.format === 'image/png') {
			return canvasToBlob(canvas, 'image/png');
		}
		return canvasToBlob(canvas, input.format, quality);
	};

	if (input.format === 'image/png') {
		const scales = input.maxBytes ? [1, 0.9, 0.8, 0.7, 0.6, 0.5] : [1];
		let best: SignatureRenderResult | null = null;
		let attempts = 0;
		for (const scale of scales) {
			attempts += 1;
			const width = Math.max(1, Math.round(baseW * scale));
			const height = Math.max(1, Math.round(baseH * scale));
			const blob = await encodeAt(width, height, 1);
			const metLimit =
				input.maxBytes === null || input.maxBytes <= 0
					? true
					: blob.size <= input.maxBytes;
			const candidate: SignatureRenderResult = {
				blob,
				width,
				height,
				outputBytes: blob.size,
				metLimit,
				maxBytes: input.maxBytes !== null && input.maxBytes > 0 ? input.maxBytes : null,
				message: null,
				quality: 1,
				scale,
				attempts,
			};
			if (!best || blob.size < best.outputBytes) best = candidate;
			if (metLimit) return candidate;
			if (!input.maxBytes) return candidate;
		}
		return {
			...best!,
			metLimit: false,
			attempts,
			message:
				'Could not reach the target file size with PNG scale steps. Try JPEG/WebP, a larger KB limit, or smaller dimensions.',
		};
	}

	const outcome = await compressImage({
		sourceWidth: baseW,
		sourceHeight: baseH,
		originalBytes: input.originalBytes,
		startQuality: input.startQuality,
		format: input.format as CompressFormat,
		maxBytes: input.maxBytes,
		encode: async ({ width, height, quality }) => encodeAt(width, height, quality),
	});

	return {
		blob: outcome.blob,
		width: outcome.width,
		height: outcome.height,
		outputBytes: outcome.outputBytes,
		metLimit: outcome.metLimit,
		maxBytes: outcome.maxBytes,
		message: outcome.message,
		quality: outcome.quality,
		scale: outcome.scale,
		attempts: outcome.attempts,
	};
}

/**
 * Draw source image onto a canvas at exact pixel size (browser-only).
 */
export function drawResizedCanvas(
	source: CanvasImageSource,
	width: number,
	height: number,
): HTMLCanvasElement {
	const w = Math.max(1, Math.floor(width));
	const h = Math.max(1, Math.floor(height));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas 2D is not available in this browser.');
	}
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';
	ctx.drawImage(source, 0, 0, w, h);
	return canvas;
}

export function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob) {
					reject(new Error('Could not encode the resized image.'));
					return;
				}
				resolve(blob);
			},
			type,
			quality,
		);
	});
}

/** Prefer JPEG for photo-like sources; keep PNG/WebP when that was the input. */
export function outputMimeFor(inputType: string): { type: string; quality?: number; ext: string } {
	const t = inputType.toLowerCase();
	if (t === 'image/png') return { type: 'image/png', ext: 'png' };
	if (t === 'image/webp') return { type: 'image/webp', quality: 0.92, ext: 'webp' };
	return { type: 'image/jpeg', quality: 0.92, ext: 'jpg' };
}

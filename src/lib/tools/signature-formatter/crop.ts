export type CropRect = {
	/** Left edge in source pixels */
	x: number;
	/** Top edge in source pixels */
	y: number;
	width: number;
	height: number;
};

/** Full-frame crop. */
export function fullCrop(sourceWidth: number, sourceHeight: number): CropRect {
	return {
		x: 0,
		y: 0,
		width: Math.max(1, Math.floor(sourceWidth)),
		height: Math.max(1, Math.floor(sourceHeight)),
	};
}

/** Keep crop inside the image; enforce min 1×1. */
export function clampCropRect(
	rect: CropRect,
	sourceWidth: number,
	sourceHeight: number,
): CropRect {
	const sw = Math.max(1, Math.floor(sourceWidth));
	const sh = Math.max(1, Math.floor(sourceHeight));
	let width = Math.max(1, Math.floor(rect.width));
	let height = Math.max(1, Math.floor(rect.height));
	width = Math.min(width, sw);
	height = Math.min(height, sh);
	let x = Math.floor(rect.x);
	let y = Math.floor(rect.y);
	x = Math.min(Math.max(0, x), sw - width);
	y = Math.min(Math.max(0, y), sh - height);
	return { x, y, width, height };
}

/** Normalized 0–1 crop (for UI storage). */
export function cropToNormalized(rect: CropRect, sw: number, sh: number) {
	const c = clampCropRect(rect, sw, sh);
	return {
		x: c.x / sw,
		y: c.y / sh,
		width: c.width / sw,
		height: c.height / sh,
	};
}

export function normalizedToCrop(
	n: { x: number; y: number; width: number; height: number },
	sw: number,
	sh: number,
): CropRect {
	return clampCropRect(
		{
			x: n.x * sw,
			y: n.y * sh,
			width: n.width * sw,
			height: n.height * sh,
		},
		sw,
		sh,
	);
}

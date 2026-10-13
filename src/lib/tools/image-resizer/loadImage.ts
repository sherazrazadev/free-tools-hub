import { decodeErrorMessage, validateImageFile } from './validate';
import { createManagedObjectUrl } from './objectUrl';
import type { ImageValidateResult } from './types';

export type LoadedImage = {
	image: HTMLImageElement;
	naturalWidth: number;
	naturalHeight: number;
	objectUrl: string;
	revoke: () => void;
	file: File;
};

export type LoadImageResult =
	| { ok: true; value: LoadedImage }
	| { ok: false; error: Extract<ImageValidateResult, { ok: false }> };

/**
 * Validate file, decode via HTMLImageElement, revoke on failure.
 * Caller must call `revoke()` when finished with a successful load.
 */
export function loadImageFromFile(file: File): Promise<LoadImageResult> {
	const validation = validateImageFile(file);
	if (!validation.ok) {
		return Promise.resolve({ ok: false, error: validation });
	}

	const managed = createManagedObjectUrl(file);

	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => {
			const naturalWidth = image.naturalWidth || image.width;
			const naturalHeight = image.naturalHeight || image.height;
			if (naturalWidth < 1 || naturalHeight < 1) {
				managed.revoke();
				resolve({
					ok: false,
					error: { ok: false, code: 'decode', message: decodeErrorMessage() },
				});
				return;
			}
			resolve({
				ok: true,
				value: {
					image,
					naturalWidth,
					naturalHeight,
					objectUrl: managed.url,
					revoke: managed.revoke,
					file,
				},
			});
		};
		image.onerror = () => {
			managed.revoke();
			resolve({
				ok: false,
				error: { ok: false, code: 'decode', message: decodeErrorMessage() },
			});
		};
		image.src = managed.url;
	});
}

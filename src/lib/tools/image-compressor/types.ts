export type CompressFormat = 'image/jpeg' | 'image/webp';

export type EncodeParams = {
	width: number;
	height: number;
	quality: number;
	type: CompressFormat;
	scale: number;
};

export type CompressOutcome = {
	/** Best blob produced (meets limit if possible, else smallest attempted). */
	blob: Blob;
	width: number;
	height: number;
	quality: number;
	scale: number;
	format: CompressFormat;
	originalBytes: number;
	outputBytes: number;
	maxBytes: number | null;
	/** True when no max was set, or outputBytes <= maxBytes. */
	metLimit: boolean;
	attempts: number;
	message: string | null;
};

export type EncodeFn = (params: EncodeParams) => Promise<Blob>;

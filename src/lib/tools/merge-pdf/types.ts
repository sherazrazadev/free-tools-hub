export type PdfValidateErrorCode = 'empty' | 'type' | 'size' | 'count' | 'total';

export type PdfValidateResult =
	| { ok: true }
	| { ok: false; code: PdfValidateErrorCode; message: string };

export type MergeItem = {
	/** Stable client id for reorder/remove */
	id: string;
	name: string;
	bytes: Uint8Array;
	pageCount: number;
};

export type MergeResult =
	| { ok: true; bytes: Uint8Array; pageCount: number }
	| { ok: false; message: string };

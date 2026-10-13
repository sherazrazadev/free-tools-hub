export type ImageLoadErrorCode =
	| 'empty'
	| 'type'
	| 'size'
	| 'decode';

export type ImageValidateResult =
	| { ok: true }
	| { ok: false; code: ImageLoadErrorCode; message: string };

export type OutputDimensions = {
	width: number;
	height: number;
};

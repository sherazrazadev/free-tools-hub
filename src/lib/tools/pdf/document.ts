import { PDFDocument } from 'pdf-lib';

export type PdfLoadErrorCode = 'encrypted' | 'malformed' | 'unknown';

export type PdfLoadResult =
	| { ok: true; doc: PDFDocument; pageCount: number }
	| { ok: false; code: PdfLoadErrorCode; message: string };

/** Map pdf-lib / parser errors to stable user-facing codes (testable without fixtures). */
export function classifyPdfLoadError(err: unknown): {
	code: PdfLoadErrorCode;
	message: string;
} {
	const text = err instanceof Error ? err.message : String(err);
	const lower = text.toLowerCase();

	if (lower.includes('encrypt') || lower.includes('password')) {
		return {
			code: 'encrypted',
			message:
				'This PDF is encrypted or password-protected. Remove the password, then try again.',
		};
	}

	if (
		lower.includes('invalid') ||
		lower.includes('failed to parse') ||
		lower.includes('not a pdf') ||
		lower.includes('eof')
	) {
		return {
			code: 'malformed',
			message: 'Could not read this PDF. It may be damaged or not a valid PDF file.',
		};
	}

	return {
		code: 'unknown',
		message: 'Could not open this PDF in the browser.',
	};
}

/**
 * Load a PDF from bytes. Encrypted and malformed files fail with clear codes.
 */
export async function loadPdfDocument(
	bytes: ArrayBuffer | Uint8Array,
): Promise<PdfLoadResult> {
	try {
		const doc = await PDFDocument.load(bytes, {
			ignoreEncryption: false,
		});
		return { ok: true, doc, pageCount: doc.getPageCount() };
	} catch (err) {
		const classified = classifyPdfLoadError(err);
		return { ok: false, ...classified };
	}
}

export async function savePdfBytes(doc: PDFDocument): Promise<Uint8Array> {
	return doc.save();
}

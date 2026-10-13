import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, savePdfBytes } from '../pdf/document';

export type SplitResult =
	| { ok: true; bytes: Uint8Array; pageCount: number }
	| { ok: false; message: string };

/**
 * Copy the given 0-based page indices from a PDF into a new document (pdf-lib, local).
 */
export async function splitPdfByIndices(
	bytes: ArrayBuffer | Uint8Array,
	indices: readonly number[],
): Promise<SplitResult> {
	if (indices.length === 0) {
		return { ok: false, message: 'No pages selected.' };
	}

	const loaded = await loadPdfDocument(bytes);
	if (!loaded.ok) {
		return { ok: false, message: loaded.message };
	}

	const pageCount = loaded.pageCount;
	for (const index of indices) {
		if (!Number.isInteger(index) || index < 0 || index >= pageCount) {
			return {
				ok: false,
				message: `Page selection is out of range for this ${pageCount}-page PDF.`,
			};
		}
	}

	try {
		const out = await PDFDocument.create();
		const pages = await out.copyPages(loaded.doc, [...indices]);
		for (const page of pages) {
			out.addPage(page);
		}
		const saved = await savePdfBytes(out);
		return { ok: true, bytes: saved, pageCount: out.getPageCount() };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Split failed.';
		return { ok: false, message };
	}
}

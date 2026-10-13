import { PDFDocument } from 'pdf-lib';
import { loadPdfDocument, savePdfBytes } from '../pdf/document';
import type { MergeItem, MergeResult } from './types';

/**
 * Merge PDFs in list order into one document. All work is local (pdf-lib).
 */
export async function mergePdfItems(items: readonly MergeItem[]): Promise<MergeResult> {
	if (items.length === 0) {
		return { ok: false, message: 'Add at least one PDF to merge.' };
	}

	try {
		const out = await PDFDocument.create();

		for (const item of items) {
			const loaded = await loadPdfDocument(item.bytes);
			if (!loaded.ok) {
				return {
					ok: false,
					message: `${item.name}: ${loaded.message}`,
				};
			}

			const indices = loaded.doc.getPageIndices();
			const pages = await out.copyPages(loaded.doc, indices);
			for (const page of pages) {
				out.addPage(page);
			}
		}

		const bytes = await savePdfBytes(out);
		return { ok: true, bytes, pageCount: out.getPageCount() };
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Merge failed.';
		return { ok: false, message };
	}
}

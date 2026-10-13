import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdfDocument } from '../pdf/document';
import { parsePageRanges } from './ranges';
import { splitPdfByIndices } from './split';

async function makeMultiPagePdf(labels: string[]): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const font = await doc.embedFont(StandardFonts.Helvetica);
	for (const label of labels) {
		const page = doc.addPage([200, 200]);
		page.drawText(label, { x: 20, y: 100, size: 12, font });
	}
	return doc.save();
}

describe('splitPdfByIndices', () => {
	it('extracts selected pages in order', async () => {
		const bytes = await makeMultiPagePdf(['A', 'B', 'C', 'D']);
		const ranges = parsePageRanges('2,4', 4);
		expect(ranges.ok).toBe(true);
		if (!ranges.ok) return;

		const result = await splitPdfByIndices(bytes, ranges.indices);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.pageCount).toBe(2);

		const reloaded = await loadPdfDocument(result.bytes);
		expect(reloaded.ok).toBe(true);
		if (reloaded.ok) expect(reloaded.pageCount).toBe(2);
	});

	it('fails on empty indices', async () => {
		const bytes = await makeMultiPagePdf(['A']);
		const result = await splitPdfByIndices(bytes, []);
		expect(result.ok).toBe(false);
	});

	it('fails on garbage pdf', async () => {
		const garbage = new TextEncoder().encode('not-a-pdf');
		const result = await splitPdfByIndices(garbage, [0]);
		expect(result.ok).toBe(false);
	});
});

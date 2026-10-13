import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdfDocument } from '../pdf/document';
import { mergePdfItems } from './merge';

async function makePdfBytes(label: string): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const page = doc.addPage([200, 200]);
	const font = await doc.embedFont(StandardFonts.Helvetica);
	page.drawText(label, { x: 20, y: 100, size: 12, font });
	return doc.save();
}

describe('loadPdfDocument', () => {
	it('loads a valid pdf', async () => {
		const bytes = await makePdfBytes('ok');
		const result = await loadPdfDocument(bytes);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.pageCount).toBe(1);
	});

	it('rejects garbage bytes', async () => {
		const garbage = new TextEncoder().encode('not-a-pdf');
		const result = await loadPdfDocument(garbage);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(['malformed', 'unknown']).toContain(result.code);
	});
});

describe('mergePdfItems', () => {
	it('merges pages in list order', async () => {
		const a = await makePdfBytes('A');
		const b = await makePdfBytes('B');
		const result = await mergePdfItems([
			{ id: '1', name: 'a.pdf', bytes: a, pageCount: 1 },
			{ id: '2', name: 'b.pdf', bytes: b, pageCount: 1 },
		]);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.pageCount).toBe(2);

		const reloaded = await loadPdfDocument(result.bytes);
		expect(reloaded.ok).toBe(true);
		if (reloaded.ok) expect(reloaded.pageCount).toBe(2);
	});

	it('fails on empty list', async () => {
		const result = await mergePdfItems([]);
		expect(result.ok).toBe(false);
	});
});

import { PDFDocument, StandardFonts } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { classifyPdfLoadError, loadPdfDocument } from './document';

async function makePlainPdf(): Promise<Uint8Array> {
	const doc = await PDFDocument.create();
	const page = doc.addPage([200, 200]);
	const font = await doc.embedFont(StandardFonts.Helvetica);
	page.drawText('plain', { x: 20, y: 100, size: 12, font });
	return doc.save();
}

describe('classifyPdfLoadError', () => {
	it('maps encryption / password errors', () => {
		const r = classifyPdfLoadError(new Error('Input document to `PDFDocument.load` is encrypted'));
		expect(r.code).toBe('encrypted');
		expect(r.message.toLowerCase()).toMatch(/password|encrypt/);
	});

	it('maps parse / invalid errors', () => {
		const r = classifyPdfLoadError(new Error('Failed to parse PDF document'));
		expect(r.code).toBe('malformed');
	});
});

describe('loadPdfDocument graceful failures', () => {
	it('rejects malformed bytes without throwing', async () => {
		const result = await loadPdfDocument(new TextEncoder().encode('%PDF-not-really'));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(['malformed', 'unknown']).toContain(result.code);
			expect(result.message.length).toBeGreaterThan(10);
		}
	});

	it('loads a plain PDF', async () => {
		const bytes = await makePlainPdf();
		const result = await loadPdfDocument(bytes);
		expect(result.ok).toBe(true);
	});
});

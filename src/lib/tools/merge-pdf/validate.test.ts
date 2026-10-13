import { describe, expect, it } from 'vitest';
import {
	MAX_PDF_BYTES,
	MAX_PDF_FILES,
	MAX_TOTAL_PDF_BYTES,
	isPdfFile,
	validatePdfFile,
	validatePdfSelection,
} from './validate';

describe('isPdfFile', () => {
	it('accepts application/pdf', () => {
		expect(isPdfFile({ type: 'application/pdf', size: 10, name: 'a.bin' })).toBe(true);
	});

	it('accepts .pdf extension when type is empty', () => {
		expect(isPdfFile({ type: '', size: 10, name: 'Report.PDF' })).toBe(true);
	});

	it('rejects non-pdf', () => {
		expect(isPdfFile({ type: 'image/png', size: 10, name: 'a.png' })).toBe(false);
	});
});

describe('validatePdfFile', () => {
	it('rejects empty', () => {
		const r = validatePdfFile(null);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('empty');
	});

	it('rejects oversize', () => {
		const r = validatePdfFile({
			type: 'application/pdf',
			size: MAX_PDF_BYTES + 1,
			name: 'big.pdf',
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('size');
	});

	it('accepts a normal pdf', () => {
		expect(
			validatePdfFile({ type: 'application/pdf', size: 1024, name: 'a.pdf' }).ok,
		).toBe(true);
	});
});

describe('validatePdfSelection', () => {
	it('rejects empty list', () => {
		const r = validatePdfSelection([]);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('empty');
	});

	it('rejects too many files', () => {
		const files = Array.from({ length: MAX_PDF_FILES + 1 }, (_, i) => ({
			type: 'application/pdf',
			size: 10,
			name: `${i}.pdf`,
		}));
		const r = validatePdfSelection(files);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('count');
	});

	it('rejects total oversize', () => {
		// Each file under per-file max; sum over total max.
		const chunk = Math.min(MAX_PDF_BYTES, Math.floor(MAX_TOTAL_PDF_BYTES / 3) + 1);
		const files = Array.from({ length: 4 }, (_, i) => ({
			type: 'application/pdf',
			size: chunk,
			name: `${i}.pdf`,
		}));
		expect(files.reduce((n, f) => n + f.size, 0)).toBeGreaterThan(MAX_TOTAL_PDF_BYTES);
		const r = validatePdfSelection(files);
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('total');
	});
});

import { describe, expect, it } from 'vitest';
import {
	ALLOWED_IMAGE_TYPES,
	MAX_IMAGE_BYTES,
	isAllowedImageType,
	validateImageFile,
} from './validate';

describe('isAllowedImageType', () => {
	it('accepts listed MIME types', () => {
		for (const type of ALLOWED_IMAGE_TYPES) {
			expect(isAllowedImageType(type)).toBe(true);
		}
	});

	it('rejects other types', () => {
		expect(isAllowedImageType('application/pdf')).toBe(false);
		expect(isAllowedImageType('image/svg+xml')).toBe(false);
		expect(isAllowedImageType('')).toBe(false);
	});
});

describe('validateImageFile', () => {
	it('rejects empty / missing', () => {
		expect(validateImageFile(null).ok).toBe(false);
		expect(validateImageFile({ type: 'image/png', size: 0 }).ok).toBe(false);
		const empty = validateImageFile({ type: 'image/png', size: 0 });
		if (!empty.ok) expect(empty.code).toBe('empty');
	});

	it('rejects unsupported type', () => {
		const r = validateImageFile({ type: 'image/svg+xml', size: 100 });
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('type');
	});

	it('rejects oversized files', () => {
		const r = validateImageFile({
			type: 'image/jpeg',
			size: MAX_IMAGE_BYTES + 1,
		});
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.code).toBe('size');
	});

	it('accepts valid jpeg within limit', () => {
		const r = validateImageFile({
			type: 'image/jpeg',
			size: 1024,
			name: 'a.jpg',
		});
		expect(r).toEqual({ ok: true });
	});
});

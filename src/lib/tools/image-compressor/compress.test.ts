import { describe, expect, it, vi } from 'vitest';
import { compressImage } from './compress';

function fakeBlob(size: number): Blob {
	return {
		size,
		type: 'image/jpeg',
		arrayBuffer: async () => new ArrayBuffer(0),
		bytes: async () => new Uint8Array(),
		slice: () => fakeBlob(size),
		stream: () => new ReadableStream(),
		text: async () => '',
	} as Blob;
}

describe('compressImage', () => {
	it('single encode when no max KB', async () => {
		const encode = vi.fn(async () => fakeBlob(40_000));
		const out = await compressImage({
			sourceWidth: 800,
			sourceHeight: 600,
			originalBytes: 120_000,
			startQuality: 0.8,
			format: 'image/jpeg',
			maxBytes: null,
			encode,
		});
		expect(encode).toHaveBeenCalledTimes(1);
		expect(out.metLimit).toBe(true);
		expect(out.outputBytes).toBe(40_000);
		expect(out.message).toBeNull();
	});

	it('stops when an attempt meets the limit', async () => {
		const encode = vi.fn(async (p) => {
			if (p.quality <= 0.7) return fakeBlob(8_000);
			return fakeBlob(50_000);
		});
		const out = await compressImage({
			sourceWidth: 100,
			sourceHeight: 100,
			originalBytes: 90_000,
			startQuality: 0.85,
			format: 'image/jpeg',
			maxBytes: 10_000,
			encode,
		});
		expect(out.metLimit).toBe(true);
		expect(out.outputBytes).toBe(8_000);
		expect(out.attempts).toBeGreaterThan(1);
		expect(out.attempts).toBeLessThan(20);
		expect(out.message).toBeNull();
	});

	it('reports unmet limit and keeps smallest blob', async () => {
		const encode = vi.fn(async (p) => fakeBlob(Math.round(30_000 * p.quality * p.scale)));
		const out = await compressImage({
			sourceWidth: 100,
			sourceHeight: 100,
			originalBytes: 200_000,
			startQuality: 0.5,
			format: 'image/webp',
			maxBytes: 100,
			encode,
		});
		expect(out.metLimit).toBe(false);
		expect(out.message).toMatch(/Could not reach the target/i);
		expect(out.outputBytes).toBeLessThan(30_000);
		expect(encode.mock.calls.length).toBe(out.attempts);
	});
});

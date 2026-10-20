import { describe, expect, it } from 'vitest';
import { formatBytes } from './format';

describe('formatBytes', () => {
	it('formats bytes, KB and MB', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(512)).toBe('512 B');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatBytes(250 * 1024)).toBe('250 KB');
		expect(formatBytes(2.4 * 1024 * 1024)).toBe('2.4 MB');
		expect(formatBytes(18 * 1024 * 1024)).toBe('18 MB');
	});

	it('returns empty string for invalid input', () => {
		expect(formatBytes(-1)).toBe('');
		expect(formatBytes(Number.NaN)).toBe('');
	});
});

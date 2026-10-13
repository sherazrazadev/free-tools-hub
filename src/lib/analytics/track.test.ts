import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAnalyticsEventName, sanitizeToolId } from './events';
import { track } from './track';

function withFakeWindow(gtag: ReturnType<typeof vi.fn>) {
	const prev = globalThis.window;
	const fake = { gtag } as unknown as Window & typeof globalThis;
	Object.defineProperty(globalThis, 'window', {
		configurable: true,
		writable: true,
		value: fake,
	});
	return () => {
		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			writable: true,
			value: prev,
		});
	};
}

describe('sanitizeToolId', () => {
	it('accepts route slugs', () => {
		expect(sanitizeToolId('work-hours')).toBe('work-hours');
		expect(sanitizeToolId('Merge-PDF')).toBe('merge-pdf');
	});

	it('rejects paths, spaces, and long junk', () => {
		expect(sanitizeToolId('/tools/work-hours')).toBeNull();
		expect(sanitizeToolId('a b')).toBeNull();
		expect(sanitizeToolId('x'.repeat(80))).toBeNull();
		expect(sanitizeToolId('')).toBeNull();
	});
});

describe('isAnalyticsEventName', () => {
	it('allowlists only the three product events', () => {
		expect(isAnalyticsEventName('tool_start')).toBe(true);
		expect(isAnalyticsEventName('tool_complete')).toBe(true);
		expect(isAnalyticsEventName('tool_export')).toBe(true);
		expect(isAnalyticsEventName('page_view')).toBe(false);
		expect(isAnalyticsEventName('tool_input')).toBe(false);
	});
});

describe('track', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('no-ops when measurement id is unset', () => {
		vi.stubEnv('PUBLIC_GA_MEASUREMENT_ID', '');
		const gtag = vi.fn();
		const restore = withFakeWindow(gtag);
		track('tool_start', { tool_id: 'work-hours' });
		expect(gtag).not.toHaveBeenCalled();
		restore();
	});

	it('sends only event name and tool_id when enabled', () => {
		vi.stubEnv('PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123');
		const gtag = vi.fn();
		const restore = withFakeWindow(gtag);
		track('tool_export', { tool_id: 'merge-pdf' });
		expect(gtag).toHaveBeenCalledTimes(1);
		expect(gtag).toHaveBeenCalledWith('event', 'tool_export', { tool_id: 'merge-pdf' });
		restore();
	});

	it('drops invalid tool ids', () => {
		vi.stubEnv('PUBLIC_GA_MEASUREMENT_ID', 'G-TEST123');
		const gtag = vi.fn();
		const restore = withFakeWindow(gtag);
		track('tool_start', { tool_id: 'evil payload' });
		expect(gtag).not.toHaveBeenCalled();
		restore();
	});
});

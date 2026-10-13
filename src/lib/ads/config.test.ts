import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdsEnabled } from './config';

describe('isAdsEnabled', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('is false by default', () => {
		vi.stubEnv('PUBLIC_ADS_ENABLED', '');
		expect(isAdsEnabled()).toBe(false);
	});

	it('is true only for explicit truthy flags', () => {
		vi.stubEnv('PUBLIC_ADS_ENABLED', 'true');
		expect(isAdsEnabled()).toBe(true);
		vi.stubEnv('PUBLIC_ADS_ENABLED', '1');
		expect(isAdsEnabled()).toBe(true);
		vi.stubEnv('PUBLIC_ADS_ENABLED', 'yes');
		expect(isAdsEnabled()).toBe(true);
		vi.stubEnv('PUBLIC_ADS_ENABLED', 'false');
		expect(isAdsEnabled()).toBe(false);
	});
});

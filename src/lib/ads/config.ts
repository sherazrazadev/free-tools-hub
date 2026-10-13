/**
 * Ads stay off until the operator sets PUBLIC_ADS_ENABLED=true at build time.
 * Even when enabled, slots are layout-only until AdSense approval (no ad script yet).
 */

export function isAdsEnabled(): boolean {
	const flag = import.meta.env.PUBLIC_ADS_ENABLED;
	if (typeof flag !== 'string') return false;
	const normalized = flag.trim().toLowerCase();
	return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

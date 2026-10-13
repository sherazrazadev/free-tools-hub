/**
 * Client analytics is off unless a public measurement ID is set at build time.
 * Set `PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXX` in Cloudflare Pages env (or `.env`).
 */

export function getGaMeasurementId(): string | undefined {
	const id = import.meta.env.PUBLIC_GA_MEASUREMENT_ID;
	if (typeof id !== 'string') return undefined;
	const trimmed = id.trim();
	if (!trimmed || trimmed === 'G-XXXXXXXX') return undefined;
	return trimmed;
}

export function isAnalyticsEnabled(): boolean {
	return Boolean(getGaMeasurementId());
}

export function getGoogleSiteVerification(): string | undefined {
	const token = import.meta.env.PUBLIC_GOOGLE_SITE_VERIFICATION;
	if (typeof token !== 'string') return undefined;
	const trimmed = token.trim();
	return trimmed || undefined;
}

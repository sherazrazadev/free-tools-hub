/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_GA_MEASUREMENT_ID?: string;
	readonly PUBLIC_GOOGLE_SITE_VERIFICATION?: string;
	/** Set to `true` to render empty AdSense layout zones (no ad script until approval). */
	readonly PUBLIC_ADS_ENABLED?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

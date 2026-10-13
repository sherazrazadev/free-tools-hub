import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, SITE_URL } from './site';

const META_DESCRIPTION_MAX = 160;

/** Normalize a pathname to a trailing-slash canonical URL. */
export function canonicalUrl(pathname: string, site = SITE_URL): string {
	const origin = site.replace(/\/$/, '');
	const path = pathname.replace(/\/$/, '') || '';
	return path === '' ? `${origin}/` : `${origin}${path}/`;
}

/** Trim descriptions for SERP/OG length without cutting mid-word when possible. */
export function truncateDescription(text: string, max = META_DESCRIPTION_MAX): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= max) return normalized;
	const sliced = normalized.slice(0, max - 1);
	const lastSpace = sliced.lastIndexOf(' ');
	const base = lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced;
	return `${base.replace(/[.,;:!?-]+$/, '')}…`;
}

export type PageMetaInput = {
	title?: string;
	description?: string;
	pathname: string;
	noindex?: boolean;
	ogType?: 'website' | 'article';
};

export type PageMeta = {
	title: string;
	description: string;
	canonicalUrl: string;
	robots: string;
	og: {
		type: string;
		siteName: string;
		title: string;
		description: string;
		url: string;
	};
	twitter: {
		card: 'summary';
		title: string;
		description: string;
	};
};

/** Default title/description + OG/Twitter fields for layout head tags. */
export function buildPageMeta({
	title = DEFAULT_TITLE,
	description = DEFAULT_DESCRIPTION,
	pathname,
	noindex = false,
	ogType = 'website',
}: PageMetaInput): PageMeta {
	const desc = truncateDescription(description);
	const url = canonicalUrl(pathname);

	return {
		title,
		description: desc,
		canonicalUrl: url,
		robots: noindex ? 'noindex, nofollow' : 'index, follow',
		og: {
			type: ogType,
			siteName: SITE_NAME,
			title,
			description: desc,
			url,
		},
		twitter: {
			card: 'summary',
			title,
			description: desc,
		},
	};
}

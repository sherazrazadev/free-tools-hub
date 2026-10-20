import { liveTools } from '../routes';
import {
	guideProblems,
	publishedGuides,
	sortGuides,
	todayUtc,
	type Guide,
} from './guides';

const modules = import.meta.glob<unknown>('/src/content/guides/*.json', {
	eager: true,
	import: 'default',
});

const liveSlugs = liveTools().map((t) => t.slug);

/** Every guide file, validated. A bad file fails the build with a clear message. */
export const allGuides: Guide[] = sortGuides(
	Object.entries(modules).map(([path, data]) => {
		const fileSlug = path.split('/').pop()!.replace(/\.json$/, '');
		const problems = guideProblems(data, liveSlugs, fileSlug);
		if (problems.length > 0) {
			throw new Error(`Invalid guide ${path}:\n - ${problems.join('\n - ')}`);
		}
		return data as Guide;
	}),
);

/** Guides whose publishDate has arrived (UTC) at build time. */
export function getPublishedGuides(now: Date = new Date()): Guide[] {
	return publishedGuides(allGuides, todayUtc(now));
}

export function getPublishedGuidesForTool(toolSlug: string, now: Date = new Date()): Guide[] {
	return getPublishedGuides(now).filter((g) => g.tool === toolSlug);
}

export function toolBySlug(slug: string) {
	return liveTools().find((t) => t.slug === slug);
}

export type { Guide };

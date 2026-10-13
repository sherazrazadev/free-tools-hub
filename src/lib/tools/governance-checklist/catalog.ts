import type { ChecklistSectionDef } from './types';

export function allItems(sections: readonly ChecklistSectionDef[]) {
	return sections.flatMap((section) =>
		section.items.map((item) => ({ section, item })),
	);
}

export function findItem(sections: readonly ChecklistSectionDef[], itemId: string) {
	for (const section of sections) {
		const item = section.items.find((i) => i.id === itemId);
		if (item) return { section, item };
	}
	return null;
}

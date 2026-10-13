/**
 * Move an item at `fromIndex` to `toIndex` (clamped). Pure helper for list reorder.
 */
export function moveItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
	if (items.length === 0) return [];
	const from = Math.max(0, Math.min(items.length - 1, fromIndex));
	const to = Math.max(0, Math.min(items.length - 1, toIndex));
	if (from === to) return [...items];
	const next = [...items];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}

export function removeAtIndex<T>(items: readonly T[], index: number): T[] {
	if (index < 0 || index >= items.length) return [...items];
	return items.filter((_, i) => i !== index);
}

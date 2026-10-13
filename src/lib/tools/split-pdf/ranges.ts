export type RangeParseErrorCode = 'empty' | 'syntax' | 'bounds' | 'none';

export type RangeParseResult =
	| { ok: true; /** 0-based page indices in selection order (deduped) */ indices: number[] }
	| { ok: false; code: RangeParseErrorCode; message: string };

/**
 * Parse 1-based page ranges like `1-3,5,7-9` into 0-based indices.
 * Page 1 is the first page of the PDF (common reader numbering).
 */
export function parsePageRanges(input: string, pageCount: number): RangeParseResult {
	if (pageCount < 1) {
		return {
			ok: false,
			code: 'none',
			message: 'This PDF has no pages to extract.',
		};
	}

	const raw = input.trim();
	if (!raw) {
		return {
			ok: false,
			code: 'empty',
			message: 'Enter page ranges (for example 1-3,5). Page 1 is the first page.',
		};
	}

	const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
	if (parts.length === 0) {
		return {
			ok: false,
			code: 'empty',
			message: 'Enter page ranges (for example 1-3,5). Page 1 is the first page.',
		};
	}

	const seen = new Set<number>();
	const indices: number[] = [];

	for (const part of parts) {
		const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(part);
		const singleMatch = /^(\d+)$/.exec(part);

		if (rangeMatch) {
			const start = Number(rangeMatch[1]);
			const end = Number(rangeMatch[2]);
			if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1) {
				return {
					ok: false,
					code: 'syntax',
					message: `Invalid range “${part}”. Use whole numbers like 1-3.`,
				};
			}
			if (start > end) {
				return {
					ok: false,
					code: 'syntax',
					message: `Invalid range “${part}”. Start page must be less than or equal to end page.`,
				};
			}
			if (end > pageCount) {
				return {
					ok: false,
					code: 'bounds',
					message: `Page ${end} is out of range. This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'} (numbered 1–${pageCount}).`,
				};
			}
			for (let page = start; page <= end; page++) {
				const index = page - 1;
				if (!seen.has(index)) {
					seen.add(index);
					indices.push(index);
				}
			}
			continue;
		}

		if (singleMatch) {
			const page = Number(singleMatch[1]);
			if (!Number.isInteger(page) || page < 1) {
				return {
					ok: false,
					code: 'syntax',
					message: `Invalid page “${part}”. Use whole numbers starting at 1.`,
				};
			}
			if (page > pageCount) {
				return {
					ok: false,
					code: 'bounds',
					message: `Page ${page} is out of range. This PDF has ${pageCount} page${pageCount === 1 ? '' : 's'} (numbered 1–${pageCount}).`,
				};
			}
			const index = page - 1;
			if (!seen.has(index)) {
				seen.add(index);
				indices.push(index);
			}
			continue;
		}

		return {
			ok: false,
			code: 'syntax',
			message: `Could not parse “${part}”. Use commas and ranges, e.g. 1-3,5,8-10.`,
		};
	}

	if (indices.length === 0) {
		return {
			ok: false,
			code: 'none',
			message: 'No pages selected.',
		};
	}

	return { ok: true, indices };
}

/** Human-readable summary of 1-based pages from 0-based indices. */
export function formatSelectedPages(indices: readonly number[]): string {
	return indices.map((i) => String(i + 1)).join(', ');
}

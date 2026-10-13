import { emptyAnswers, normalizeAnswer } from './score';
import type { AnswerMap, ChecklistSectionDef } from './types';

export type StoredDraft = {
	version: 1;
	savedAt: string;
	answers: AnswerMap;
};

export function serializeDraft(answers: AnswerMap, savedAt: Date = new Date()): string {
	const payload: StoredDraft = {
		version: 1,
		savedAt: savedAt.toISOString(),
		answers,
	};
	return JSON.stringify(payload);
}

export function parseDraft(
	sections: readonly ChecklistSectionDef[],
	raw: string,
): AnswerMap | null {
	try {
		const data = JSON.parse(raw) as Partial<StoredDraft>;
		if (data.version !== 1 || !data.answers || typeof data.answers !== 'object') {
			return null;
		}
		const base = emptyAnswers(sections);
		for (const id of Object.keys(base)) {
			base[id] = normalizeAnswer(data.answers[id]);
		}
		return base;
	} catch {
		return null;
	}
}

export function saveDraftToLocalStorage(
	storageKey: string,
	answers: AnswerMap,
): boolean {
	if (typeof localStorage === 'undefined') return false;
	try {
		localStorage.setItem(storageKey, serializeDraft(answers));
		return true;
	} catch {
		return false;
	}
}

export function loadDraftFromLocalStorage(
	sections: readonly ChecklistSectionDef[],
	storageKey: string,
): AnswerMap | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return null;
		return parseDraft(sections, raw);
	} catch {
		return null;
	}
}

export function clearDraftFromLocalStorage(storageKey: string): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.removeItem(storageKey);
	} catch {
		/* ignore */
	}
}

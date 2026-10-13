import { CHECKLIST_SECTIONS } from './catalog';
import * as shared from '../governance-checklist/persistence';
import type { AnswerMap } from './types';

export const STORAGE_KEY = 'tools.tommyfx.ai-system-risk-checklist.v1';

export const serializeDraft = shared.serializeDraft;

export function parseDraft(raw: string) {
	return shared.parseDraft(CHECKLIST_SECTIONS, raw);
}

export function saveDraftToLocalStorage(answers: AnswerMap) {
	return shared.saveDraftToLocalStorage(STORAGE_KEY, answers);
}

export function loadDraftFromLocalStorage() {
	return shared.loadDraftFromLocalStorage(CHECKLIST_SECTIONS, STORAGE_KEY);
}

export function clearDraftFromLocalStorage() {
	shared.clearDraftFromLocalStorage(STORAGE_KEY);
}

import { CHECKLIST_SECTIONS } from './catalog';
import * as shared from '../governance-checklist/score';
import type { AnswerMap } from './types';

export const normalizeAnswer = shared.normalizeAnswer;
export const answerLabel = shared.answerLabel;

export function emptyAnswers() {
	return shared.emptyAnswers(CHECKLIST_SECTIONS);
}

export function scoreAnswers(answers: AnswerMap) {
	return shared.scoreAnswers(CHECKLIST_SECTIONS, answers);
}

export function describeGap(itemId: string) {
	return shared.describeGap(CHECKLIST_SECTIONS, itemId);
}

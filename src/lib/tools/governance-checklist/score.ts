import { allItems, findItem } from './catalog';
import type {
	AnswerMap,
	ChecklistSectionDef,
	ItemAnswer,
	ScoreSummary,
} from './types';

export function normalizeAnswer(value: unknown): ItemAnswer {
	if (value === 'yes' || value === 'no' || value === 'na' || value === 'unanswered') {
		return value;
	}
	return 'unanswered';
}

export function emptyAnswers(sections: readonly ChecklistSectionDef[]): AnswerMap {
	const map: AnswerMap = {};
	for (const { item } of allItems(sections)) {
		map[item.id] = 'unanswered';
	}
	return map;
}

/**
 * Transparent scoring (not a safety/compliance rating):
 * completion = answered/total; addressed = yes/(yes+no); gaps = No answers.
 */
export function scoreAnswers(
	sections: readonly ChecklistSectionDef[],
	answers: AnswerMap,
): ScoreSummary {
	const items = allItems(sections);
	let yes = 0;
	let no = 0;
	let na = 0;
	let unanswered = 0;
	const gapItemIds: string[] = [];
	const followUps: Array<{ itemId: string; action: string }> = [];

	for (const { item } of items) {
		const answer = normalizeAnswer(answers[item.id]);
		if (answer === 'yes') yes += 1;
		else if (answer === 'no') {
			no += 1;
			gapItemIds.push(item.id);
			followUps.push({ itemId: item.id, action: item.followUpIfNo });
		} else if (answer === 'na') na += 1;
		else unanswered += 1;
	}

	const totalItems = items.length;
	const answered = yes + no + na;
	const completionPercent =
		totalItems === 0 ? 0 : Math.round((answered / totalItems) * 1000) / 10;
	const yn = yes + no;
	const addressedPercent = yn === 0 ? null : Math.round((yes / yn) * 1000) / 10;

	return {
		totalItems,
		answered,
		yes,
		no,
		na,
		unanswered,
		completionPercent,
		addressedPercent,
		gapItemIds,
		followUps,
	};
}

export function answerLabel(answer: ItemAnswer): string {
	switch (answer) {
		case 'yes':
			return 'Yes';
		case 'no':
			return 'No';
		case 'na':
			return 'N/A';
		default:
			return 'Unanswered';
	}
}

export function describeGap(
	sections: readonly ChecklistSectionDef[],
	itemId: string,
): string {
	const found = findItem(sections, itemId);
	if (!found) return itemId;
	const ref = found.item.reference ? ` [${found.item.reference.id}]` : '';
	return `${found.section.title}: ${found.item.prompt}${ref}`;
}

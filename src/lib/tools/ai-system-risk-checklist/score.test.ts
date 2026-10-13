import { describe, expect, it } from 'vitest';
import { CHECKLIST_SECTIONS, allItems } from './catalog';
import { emptyAnswers, scoreAnswers } from './score';

describe('catalog', () => {
	it('has ten sections with purposes', () => {
		expect(CHECKLIST_SECTIONS).toHaveLength(10);
		for (const section of CHECKLIST_SECTIONS) {
			expect(section.purpose.trim().length).toBeGreaterThan(10);
			expect(section.items.length).toBeGreaterThan(0);
		}
	});
});

describe('scoreAnswers', () => {
	it('starts all unanswered', () => {
		const score = scoreAnswers(emptyAnswers());
		expect(score.totalItems).toBe(allItems().length);
		expect(score.unanswered).toBe(score.totalItems);
		expect(score.completionPercent).toBe(0);
		expect(score.addressedPercent).toBeNull();
		expect(score.gapItemIds).toEqual([]);
	});

	it('computes completion and gaps transparently', () => {
		const answers = emptyAnswers();
		const ids = allItems().map(({ item }) => item.id);
		answers[ids[0]!] = 'yes';
		answers[ids[1]!] = 'no';
		answers[ids[2]!] = 'na';

		const score = scoreAnswers(answers);
		expect(score.yes).toBe(1);
		expect(score.no).toBe(1);
		expect(score.na).toBe(1);
		expect(score.answered).toBe(3);
		expect(score.gapItemIds).toEqual([ids[1]]);
		expect(score.followUps).toHaveLength(1);
		// addressed = 1/(1+1) = 50%
		expect(score.addressedPercent).toBe(50);
	});

	it('never invents a compliance claim in summary fields', () => {
		const score = scoreAnswers(emptyAnswers());
		expect(Object.keys(score)).not.toContain('compliant');
		expect(Object.keys(score)).not.toContain('certified');
	});
});

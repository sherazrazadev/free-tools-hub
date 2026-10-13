import { describe, expect, it } from 'vitest';
import { emptyAnswers, scoreAnswers } from '../governance-checklist/score';
import { buildReportText } from '../governance-checklist/report';
import { CHECKLIST_SECTIONS } from './catalog';
import { NIST_META } from './meta';

describe('NIST AI RMF checklist catalog', () => {
	it('has four Core functions with mapped references', () => {
		expect(CHECKLIST_SECTIONS.map((s) => s.id)).toEqual([
			'govern',
			'map',
			'measure',
			'manage',
		]);
		for (const section of CHECKLIST_SECTIONS) {
			expect(section.purpose.length).toBeGreaterThan(10);
			for (const item of section.items) {
				expect(item.reference?.id).toMatch(/^(GOVERN|MAP|MEASURE|MANAGE) /);
			}
		}
	});

	it('export preserves answers and disclaimer', () => {
		const answers = emptyAnswers(CHECKLIST_SECTIONS);
		const first = Object.keys(answers)[0]!;
		answers[first] = 'no';
		const text = buildReportText(CHECKLIST_SECTIONS, NIST_META, answers);
		expect(text).toContain('not an official NIST');
		expect(text).toContain('GAPS');
		expect(text).toContain('[No]');
		const score = scoreAnswers(CHECKLIST_SECTIONS, answers);
		expect(score.no).toBe(1);
	});
});

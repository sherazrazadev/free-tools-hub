import { describe, expect, it } from 'vitest';
import { DISCLAIMER } from './types';
import { emptyAnswers } from './score';
import { buildReportText } from './report';

describe('buildReportText', () => {
	it('includes disclaimer and scoring explanation', () => {
		const text = buildReportText(emptyAnswers(), new Date('2026-10-13T12:00:00.000Z'));
		expect(text).toContain(DISCLAIMER);
		expect(text).toContain('SCORING (transparent)');
		expect(text).toContain('Completion:');
		expect(text.toLowerCase()).not.toContain('certified safe');
		expect(text).toContain('localStorage');
	});

	it('lists gaps when items are No', () => {
		const answers = emptyAnswers();
		const firstId = Object.keys(answers)[0]!;
		answers[firstId] = 'no';
		const text = buildReportText(answers);
		expect(text).toContain('GAPS');
		expect(text).toContain('SUGGESTED FOLLOW-UPS');
		expect(text).toMatch(/-/);
	});
});

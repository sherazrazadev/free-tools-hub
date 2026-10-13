import { describe, expect, it } from 'vitest';
import { emptyAnswers, scoreAnswers } from '../governance-checklist/score';
import { buildReportText } from '../governance-checklist/report';
import { CHECKLIST_SECTIONS } from './catalog';
import { OWASP_META } from './meta';

describe('OWASP LLM Top 10 checklist catalog', () => {
	it('covers LLM01–LLM10:2025 with defensive wording', () => {
		expect(CHECKLIST_SECTIONS).toHaveLength(10);
		const ids = CHECKLIST_SECTIONS.map((s) => s.id);
		expect(ids[0]).toBe('llm01');
		expect(ids[9]).toBe('llm10');
		const blob = JSON.stringify(CHECKLIST_SECTIONS).toLowerCase();
		expect(blob).not.toMatch(/how to exploit|bypass safeguar|jailbreak recipe/);
		for (const section of CHECKLIST_SECTIONS) {
			for (const item of section.items) {
				expect(item.reference?.id).toMatch(/^LLM\d{2}:2025$/);
			}
		}
	});

	it('export preserves answers', () => {
		const answers = emptyAnswers(CHECKLIST_SECTIONS);
		const id = Object.keys(answers)[0]!;
		answers[id] = 'yes';
		const text = buildReportText(CHECKLIST_SECTIONS, OWASP_META, answers);
		expect(text).toContain('defensive');
		expect(text).toContain('[Yes]');
		expect(scoreAnswers(CHECKLIST_SECTIONS, answers).yes).toBe(1);
	});
});

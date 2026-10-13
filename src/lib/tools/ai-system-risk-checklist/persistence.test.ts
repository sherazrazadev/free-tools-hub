import { describe, expect, it } from 'vitest';
import { emptyAnswers } from './score';
import { parseDraft, serializeDraft } from './persistence';

describe('persistence draft round-trip', () => {
	it('serializes and parses answers', () => {
		const answers = emptyAnswers();
		const id = Object.keys(answers)[0]!;
		answers[id] = 'yes';
		const raw = serializeDraft(answers, new Date('2026-10-13T00:00:00.000Z'));
		const loaded = parseDraft(raw);
		expect(loaded).not.toBeNull();
		expect(loaded?.[id]).toBe('yes');
	});

	it('rejects invalid JSON', () => {
		expect(parseDraft('not-json')).toBeNull();
	});
});

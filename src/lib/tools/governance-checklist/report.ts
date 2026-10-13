import { answerLabel, describeGap, scoreAnswers } from './score';
import type { AnswerMap, ChecklistSectionDef, ChecklistToolMeta } from './types';

export function buildReportText(
	sections: readonly ChecklistSectionDef[],
	meta: ChecklistToolMeta,
	answers: AnswerMap,
	generatedAt: Date = new Date(),
): string {
	const score = scoreAnswers(sections, answers);
	const lines: string[] = [];

	lines.push(meta.reportTitle);
	lines.push(`Generated: ${generatedAt.toISOString()}`);
	lines.push(meta.frameworkNote);
	lines.push('');
	lines.push('DISCLAIMER');
	lines.push(meta.disclaimer);
	lines.push(
		'Scores below measure checklist completion only. They do not mean the system is safe, compliant, or certified.',
	);
	lines.push('');
	lines.push('SCORING (transparent)');
	lines.push(`Total items: ${score.totalItems}`);
	lines.push(`Answered: ${score.answered} (Yes ${score.yes}, No ${score.no}, N/A ${score.na})`);
	lines.push(`Unanswered: ${score.unanswered}`);
	lines.push(`Completion: ${score.completionPercent}% (answered / total)`);
	lines.push(
		score.addressedPercent === null
			? 'Addressed among Yes/No answers: n/a (no Yes/No answers yet)'
			: `Addressed among Yes/No answers: ${score.addressedPercent}% (Yes / (Yes + No); N/A excluded)`,
	);
	lines.push('');
	lines.push('GAPS (answered No)');
	if (score.gapItemIds.length === 0) {
		lines.push('- None marked No');
	} else {
		for (const id of score.gapItemIds) {
			lines.push(`- ${describeGap(sections, id)}`);
		}
	}
	lines.push('');
	lines.push('SUGGESTED FOLLOW-UPS');
	if (score.followUps.length === 0) {
		lines.push('- None from No answers');
	} else {
		for (const row of score.followUps) {
			lines.push(`- (${row.itemId}) ${row.action}`);
		}
	}
	lines.push('');
	lines.push('ANSWERS BY SECTION');

	for (const section of sections) {
		lines.push('');
		lines.push(`## ${section.title}`);
		lines.push(`Purpose: ${section.purpose}`);
		for (const item of section.items) {
			const answer = answers[item.id] ?? 'unanswered';
			const ref = item.reference ? ` (ref ${item.reference.id})` : '';
			lines.push(`- [${answerLabel(answer)}] ${item.prompt}${ref}`);
		}
	}

	lines.push('');
	lines.push(
		'Persistence note: this file is a local download. Drafts may also be stored in browser localStorage on your device only; nothing is uploaded by this tool.',
	);
	lines.push('');
	return lines.join('\n');
}

export function downloadTextFile(content: string, filename: string): void {
	const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

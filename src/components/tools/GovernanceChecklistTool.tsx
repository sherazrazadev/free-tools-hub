import { useEffect, useId, useMemo, useState } from 'react';
import { useToolAnalytics } from '../../lib/analytics/useToolAnalytics';
import {
	clearDraftFromLocalStorage,
	loadDraftFromLocalStorage,
	saveDraftToLocalStorage,
} from '../../lib/tools/governance-checklist/persistence';
import { buildReportText, downloadTextFile } from '../../lib/tools/governance-checklist/report';
import { emptyAnswers, scoreAnswers } from '../../lib/tools/governance-checklist/score';
import type {
	AnswerMap,
	ChecklistSectionDef,
	ChecklistToolMeta,
	ItemAnswer,
} from '../../lib/tools/governance-checklist/types';
import '../../styles/islands/GovernanceChecklistTool.css';

const ANSWER_OPTIONS: { value: ItemAnswer; label: string }[] = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' },
	{ value: 'na', label: 'N/A' },
	{ value: 'unanswered', label: 'Clear' },
];

export type GovernanceChecklistToolProps = {
	sections: readonly ChecklistSectionDef[];
	meta: ChecklistToolMeta;
	/** Optional framework version/source blurb under persistence note. */
	sourceBlurb?: string;
};

/**
 * Shared defensive checklist island — scoring, localStorage draft, downloadable report.
 */
export default function GovernanceChecklistTool({
	sections,
	meta,
	sourceBlurb,
}: GovernanceChecklistToolProps) {
	const baseId = useId();
	const { toolExport } = useToolAnalytics(meta.toolId);
	const [answers, setAnswers] = useState<AnswerMap>(() => emptyAnswers(sections));
	const [statusNote, setStatusNote] = useState<string | null>(null);

	useEffect(() => {
		const draft = loadDraftFromLocalStorage(sections, meta.storageKey);
		if (draft) {
			setAnswers(draft);
			setStatusNote('Loaded draft from this browser’s localStorage.');
		}
		// sections/meta are stable per tool mount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const score = useMemo(() => scoreAnswers(sections, answers), [sections, answers]);

	function setAnswer(itemId: string, value: ItemAnswer) {
		setAnswers((prev) => ({ ...prev, [itemId]: value }));
		setStatusNote(null);
	}

	function onSaveDraft() {
		const ok = saveDraftToLocalStorage(meta.storageKey, answers);
		setStatusNote(
			ok
				? 'Draft saved in this browser’s localStorage (this device only).'
				: 'Could not save draft (storage blocked or unavailable).',
		);
	}

	function onClear() {
		setAnswers(emptyAnswers(sections));
		clearDraftFromLocalStorage(meta.storageKey);
		setStatusNote('Answers and local draft cleared.');
	}

	function onDownload() {
		const text = buildReportText(sections, meta, answers);
		downloadTextFile(text, meta.downloadFilename);
		toolExport();
		setStatusNote('Report download started (local file only).');
	}

	return (
		<div className="gc-tool">
			<p className="gc-tool__disclaimer">{meta.disclaimer}</p>
			<p className="gc-tool__persist">{meta.persistenceNote}</p>
			{sourceBlurb ? <p className="gc-tool__source">{sourceBlurb}</p> : null}

			<div className="gc-tool__summary" aria-live="polite">
				<p>
					Completion: <strong>{score.completionPercent}%</strong> ({score.answered}/
					{score.totalItems} answered)
				</p>
				<p>
					Gaps (No): <strong>{score.no}</strong>
					{score.addressedPercent !== null ? (
						<>
							{' '}
							· Addressed among Yes/No: <strong>{score.addressedPercent}%</strong>
						</>
					) : null}
				</p>
				<p className="gc-tool__score-note">
					These percentages only describe checklist answers. They are not a risk rating, audit
					result, or compliance score.
				</p>
			</div>

			<div className="gc-tool__actions">
				<button type="button" className="btn btn--primary" onClick={onDownload}>
					Download report
				</button>
				<button type="button" className="btn btn--ghost" onClick={onSaveDraft}>
					Save draft locally
				</button>
				<button type="button" className="btn btn--ghost" onClick={onClear}>
					Clear
				</button>
			</div>

			{statusNote ? (
				<p className="gc-tool__status" role="status">
					{statusNote}
				</p>
			) : null}

			{score.followUps.length > 0 ? (
				<div className="gc-tool__followups">
					<h3>Suggested follow-ups (from No answers)</h3>
					<ul>
						{score.followUps.map((row) => (
							<li key={row.itemId}>{row.action}</li>
						))}
					</ul>
				</div>
			) : null}

			<p className="gc-tool__pace">
				Work one function at a time. Open a section, answer Yes / No / N/A, then move on — you do
				not need to finish everything in one sitting.
			</p>

			{sections.map((section, index) => {
				const answeredInSection = section.items.filter(
					(item) => (answers[item.id] ?? 'unanswered') !== 'unanswered',
				).length;
				return (
					<details key={section.id} className="gc-tool__section" open={index === 0}>
						<summary className="gc-tool__section-summary">
							<span className="gc-tool__section-title" id={`${baseId}-${section.id}`}>
								{section.title}
							</span>
							<span className="gc-tool__section-progress">
								{answeredInSection}/{section.items.length}
							</span>
						</summary>
						<p className="gc-tool__purpose">{section.purpose}</p>
						<ul className="gc-tool__items">
							{section.items.map((item) => {
								const name = `${baseId}-${item.id}`;
								const current = answers[item.id] ?? 'unanswered';
								return (
									<li key={item.id} className="gc-tool__item">
										<p className="gc-tool__prompt">{item.prompt}</p>
										<div className="gc-tool__choices" role="group" aria-label={item.prompt}>
											{ANSWER_OPTIONS.map((opt) => (
												<label key={opt.value} className="gc-tool__choice">
													<input
														type="radio"
														name={name}
														value={opt.value}
														checked={current === opt.value}
														onChange={() => setAnswer(item.id, opt.value)}
													/>
													<span>{opt.label}</span>
												</label>
											))}
										</div>
										<details className="gc-tool__more">
											<summary>Why this matters / NIST ref</summary>
											<p className="gc-tool__rationale">{item.rationale}</p>
											{item.reference ? (
												<p className="gc-tool__ref">
													Ref:{' '}
													<a href={item.reference.url} rel="noopener noreferrer">
														{item.reference.id}
													</a>
													{' — '}
													{item.reference.label}
												</p>
											) : null}
										</details>
									</li>
								);
							})}
						</ul>
					</details>
				);
			})}
		</div>
	);
}

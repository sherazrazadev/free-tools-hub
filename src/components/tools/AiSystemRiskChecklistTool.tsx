import { useEffect, useId, useMemo, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import { CHECKLIST_SECTIONS } from "../../lib/tools/ai-system-risk-checklist/catalog";
import {
  clearDraftFromLocalStorage,
  loadDraftFromLocalStorage,
  saveDraftToLocalStorage,
} from "../../lib/tools/ai-system-risk-checklist/persistence";
import {
  buildReportText,
  downloadTextFile,
} from "../../lib/tools/ai-system-risk-checklist/report";
import {
  emptyAnswers,
  scoreAnswers,
} from "../../lib/tools/ai-system-risk-checklist/score";
import {
  DISCLAIMER,
  PERSISTENCE_NOTE,
  type AnswerMap,
  type ItemAnswer,
} from "../../lib/tools/ai-system-risk-checklist/types";
import "../../styles/islands/AiSystemRiskChecklistTool.css";

const ANSWER_OPTIONS: { value: ItemAnswer; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "na", label: "N/A" },
  { value: "unanswered", label: "Clear" },
];

/**
 * Defensive AI system risk checklist - local scoring + downloadable report.
 */
export default function AiSystemRiskChecklistTool() {
  const baseId = useId();
  const { toolExport } = useToolAnalytics("ai-system-risk-checklist");
  const [answers, setAnswers] = useState<AnswerMap>(() => emptyAnswers());
  const [statusNote, setStatusNote] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadDraftFromLocalStorage();
    if (draft) {
      setAnswers(draft);
      setStatusNote("Loaded draft from this browser’s localStorage.");
    }
  }, []);

  const score = useMemo(() => scoreAnswers(answers), [answers]);

  function setAnswer(itemId: string, value: ItemAnswer) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
    setStatusNote(null);
  }

  function onSaveDraft() {
    const ok = saveDraftToLocalStorage(answers);
    setStatusNote(
      ok
        ? "Draft saved in this browser’s localStorage (this device only)."
        : "Could not save draft (storage blocked or unavailable).",
    );
  }

  function onClear() {
    setAnswers(emptyAnswers());
    clearDraftFromLocalStorage();
    setStatusNote("Answers and local draft cleared.");
  }

  function onDownload() {
    const text = buildReportText(answers);
    downloadTextFile(text, "ai-system-risk-checklist-report.txt");
    toolExport();
    setStatusNote("Report download started (local file only).");
  }

  return (
    <div className="arc-tool">
      <p className="arc-tool__disclaimer">{DISCLAIMER}</p>
      <p className="arc-tool__persist">{PERSISTENCE_NOTE}</p>

      <div className="arc-tool__summary" aria-live="polite">
        <p>
          Completion: <strong>{score.completionPercent}%</strong> (
          {score.answered}/{score.totalItems} answered)
        </p>
        <p>
          Gaps (No): <strong>{score.no}</strong>
          {score.addressedPercent !== null ? (
            <>
              {" "}
              · Addressed among Yes/No:{" "}
              <strong>{score.addressedPercent}%</strong>
            </>
          ) : null}
        </p>
        <p className="arc-tool__score-note">
          These percentages only describe checklist answers. They are not a risk
          rating, audit result, or compliance score.
        </p>
      </div>

      <div className="arc-tool__actions">
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
        <p className="arc-tool__status" role="status">
          {statusNote}
        </p>
      ) : null}

      {score.followUps.length > 0 ? (
        <div className="arc-tool__followups">
          <h3>Suggested follow-ups (from No answers)</h3>
          <ul>
            {score.followUps.map((row) => (
              <li key={row.itemId}>{row.action}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {CHECKLIST_SECTIONS.map((section) => (
        <section
          key={section.id}
          className="arc-tool__section"
          aria-labelledby={`${baseId}-${section.id}`}
        >
          <h3 id={`${baseId}-${section.id}`}>{section.title}</h3>
          <p className="arc-tool__purpose">
            <strong>Purpose:</strong> {section.purpose}
          </p>
          <ul className="arc-tool__items">
            {section.items.map((item) => {
              const name = `${baseId}-${item.id}`;
              const current = answers[item.id] ?? "unanswered";
              return (
                <li key={item.id} className="arc-tool__item">
                  <p className="arc-tool__prompt">{item.prompt}</p>
                  <p className="arc-tool__rationale">{item.rationale}</p>
                  <div
                    className="arc-tool__choices"
                    role="group"
                    aria-label={item.prompt}
                  >
                    {ANSWER_OPTIONS.map((opt) => (
                      <label key={opt.value} className="arc-tool__choice">
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
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

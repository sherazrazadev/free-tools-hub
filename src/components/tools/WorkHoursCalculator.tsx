import { useId, useState, type KeyboardEvent } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import {
  dayTotalToCsv,
  downloadCsv,
  weekTotalToCsv,
} from "../../lib/tools/work-hours/exportCsv";
import { applyOvertime } from "../../lib/tools/work-hours/overtime";
import { parseTimeToMinutes } from "../../lib/tools/work-hours/duration";
import {
  calculateDayTotal,
  type ShiftInput,
} from "../../lib/tools/work-hours/shifts";
import {
  calculateWeekTotal,
  emptyWeek,
  fixtureWeek,
  WEEKDAY_IDS,
  WEEKDAY_LABELS,
  type WeekDayInput,
  type WeekdayId,
} from "../../lib/tools/work-hours/week";
import ResultSummary, { type ResultRow } from "../ui/ResultSummary";
import "../../styles/islands/WorkHoursCalculator.css";

type Mode = "day" | "week";

type ShiftDraft = {
  key: string;
  start: string;
  end: string;
  endsNextDay: boolean;
  breakMinutes: string;
};

type DayDraft = {
  id: WeekdayId;
  shifts: ShiftDraft[];
};

let keySeq = 0;
function nextKey(): string {
  keySeq += 1;
  return `shift-${keySeq}`;
}

function makeShift(
  partial?: Partial<Omit<ShiftDraft, "key">> & { key?: string },
): ShiftDraft {
  return {
    key: partial?.key ?? nextKey(),
    start: partial?.start ?? "09:00",
    end: partial?.end ?? "17:30",
    endsNextDay: partial?.endsNextDay ?? false,
    breakMinutes: partial?.breakMinutes ?? "30",
  };
}

function formatClock(totalMinutes: number): string {
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const m = String(totalMinutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Defaults for "Add shift": start where the previous shift ended (so the new row
 * never overlaps it) and run up to 4 hours, capped at 23:59. Falls back to the
 * generic afternoon shift when there is no room left in the day.
 */
function shiftAfter(previous: ShiftDraft | undefined): ShiftDraft {
  const fallback = makeShift({ start: "14:00", end: "18:00", breakMinutes: "0" });
  if (!previous || previous.endsNextDay) return fallback;
  const start = parseTimeToMinutes(previous.end);
  if (start === null || start >= 23 * 60 + 59) return fallback;
  const end = Math.min(start + 4 * 60, 23 * 60 + 59);
  return makeShift({
    start: formatClock(start),
    end: formatClock(end),
    breakMinutes: "0",
  });
}

/** Day OT is usually judged per day (8 h); week OT per week (40 h). */
const DEFAULT_THRESHOLD: Record<Mode, string> = { day: "8", week: "40" };

function toShiftInput(draft: ShiftDraft): ShiftInput {
  const parsed = Number(draft.breakMinutes);
  return {
    start: draft.start,
    end: draft.end,
    endsNextDay: draft.endsNextDay,
    unpaidBreakMinutes: Number.isFinite(parsed) ? parsed : Number.NaN,
  };
}

function draftsFromWeek(week: WeekDayInput[]): DayDraft[] {
  return week.map((day) => ({
    id: day.id,
    shifts: day.shifts.map((shift) =>
      makeShift({
        start: shift.start,
        end: shift.end,
        endsNextDay: shift.endsNextDay,
        breakMinutes: String(shift.unpaidBreakMinutes),
      }),
    ),
  }));
}

function weekInputsFromDrafts(days: DayDraft[]): WeekDayInput[] {
  return days.map((day) => ({
    id: day.id,
    shifts: day.shifts.map(toShiftInput),
  }));
}

function formatElapsed(hours: number, minutes: number): string {
  const hLabel = hours === 1 ? "1 hour" : `${hours} hours`;
  const mLabel = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  if (hours === 0) return mLabel;
  if (minutes === 0) return hLabel;
  return `${hLabel} ${mLabel}`;
}

/** Arrow / Home / End move between tabs (WAI-ARIA tabs pattern). */
function moveTab<T extends string>(
  e: KeyboardEvent<HTMLDivElement>,
  ids: readonly T[],
  current: T,
  select: (id: T) => void,
) {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
  e.preventDefault();
  const i = ids.indexOf(current);
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? ids.length - 1
        : (i + (e.key === "ArrowRight" ? 1 : -1) + ids.length) % ids.length;
  select(ids[next]);
  e.currentTarget
    .querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [next]?.focus();
}

function ShiftEditor({
  shift,
  title,
  canRemove,
  onChange,
  onRemove,
  netLabel,
  error,
}: {
  shift: ShiftDraft;
  title: string;
  canRemove: boolean;
  onChange: (patch: Partial<ShiftDraft>) => void;
  onRemove: () => void;
  netLabel?: string;
  /** Problem with this row, shown next to the inputs that need fixing. */
  error?: string;
}) {
  return (
    <section
      className={error ? "wh-tool__shift has-error" : "wh-tool__shift"}
    >
      <div className="wh-tool__shift-head">
        <h2>{title}</h2>
        {canRemove ? (
          <button type="button" className="wh-tool__linkish" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <div className="wh-tool__fields">
        <label className="wh-tool__field">
          <span>Start time</span>
          <input
            type="time"
            value={shift.start}
            onChange={(e) => onChange({ start: e.target.value })}
            required
          />
        </label>
        <label className="wh-tool__field">
          <span>End time</span>
          <input
            type="time"
            value={shift.end}
            onChange={(e) => onChange({ end: e.target.value })}
            required
          />
        </label>
        <label className="wh-tool__field">
          <span>Unpaid break (minutes)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={shift.breakMinutes}
            aria-invalid={
              shift.breakMinutes.trim() !== "" &&
              !(Number(shift.breakMinutes) >= 0)
                ? true
                : undefined
            }
            onChange={(e) => onChange({ breakMinutes: e.target.value })}
          />
        </label>
      </div>
      <label className="wh-tool__check">
        <input
          type="checkbox"
          checked={shift.endsNextDay}
          onChange={(e) => onChange({ endsNextDay: e.target.checked })}
        />
        <span>Ends next day (overnight shift)</span>
      </label>
      {error ? (
        <p className="wh-tool__row-error">{error}</p>
      ) : netLabel ? (
        <p className="wh-tool__row-net">{netLabel}</p>
      ) : null}
    </section>
  );
}

/**
 * Work hours calculator - day/week modes, breaks, OT estimate, CSV + print.
 */
export default function WorkHoursCalculator() {
  const baseId = useId();
  const { toolExport } = useToolAnalytics("work-hours");
  const [mode, setMode] = useState<Mode>("day");
  const [dayShifts, setDayShifts] = useState<ShiftDraft[]>(() => [makeShift()]);
  const [weekDays, setWeekDays] = useState<DayDraft[]>(() =>
    draftsFromWeek(fixtureWeek()),
  );
  const [activeDay, setActiveDay] = useState<WeekdayId>("mon");
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD.day);
  const [thresholdEdited, setThresholdEdited] = useState(false);
  const [multiplier, setMultiplier] = useState("1.5");
  const [hourlyRate, setHourlyRate] = useState("");

  const dayTotal = calculateDayTotal(dayShifts.map(toShiftInput));
  const weekTotal = calculateWeekTotal(weekInputsFromDrafts(weekDays));

  function selectMode(next: Mode) {
    setMode(next);
    // Keep a threshold the user typed; otherwise follow the mode (8 h/day, 40 h/week).
    if (!thresholdEdited) setThreshold(DEFAULT_THRESHOLD[next]);
  }

  /** Row-level problem for the shift list being edited (day mode or the active weekday). */
  function rowErrorFor(
    shifts: ShiftDraft[],
    index: number,
  ): string | undefined {
    const total = calculateDayTotal(shifts.map(toShiftInput));
    if (total.ok || total.rowIndex !== index) return undefined;
    return total.code === "row_error"
      ? (total.rowError?.message ?? total.message)
      : total.message;
  }

  /** Status shown on each weekday chip: day off, total, or a problem to fix. */
  function dayChipStatus(day: DayDraft): {
    state: "off" | "ok" | "error";
    text: string;
    spoken: string;
  } {
    if (day.shifts.length === 0) {
      return { state: "off", text: "Off", spoken: "day off" };
    }
    const total = calculateDayTotal(day.shifts.map(toShiftInput));
    if (!total.ok) {
      return { state: "error", text: "Fix", spoken: "needs fixing" };
    }
    return {
      state: "ok",
      spoken: formatElapsed(total.hours, total.minutes),
      // Compact on purpose: seven chips share one row on wider panels ("8h", "11h30").
      text: `${total.hours}h${total.minutes ? String(total.minutes).padStart(2, "0") : ""}`,
    };
  }

  const netMinutes =
    mode === "day"
      ? dayTotal.ok
        ? dayTotal.totalNetMinutes
        : 0
      : weekTotal.ok
        ? weekTotal.totalNetMinutes
        : 0;

  const thresholdNum = Number(threshold);
  const multiplierNum = Number(multiplier);
  const rateParsed = hourlyRate.trim() === "" ? null : Number(hourlyRate);

  const overtime = (mode === "day" ? dayTotal.ok : weekTotal.ok)
    ? applyOvertime(netMinutes, {
        regularThresholdHours: thresholdNum,
        overtimeMultiplier: multiplierNum,
        hourlyRate: rateParsed,
      })
    : null;

  function updateDayShift(key: string, patch: Partial<ShiftDraft>) {
    setDayShifts((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function updateWeekShift(
    dayId: WeekdayId,
    key: string,
    patch: Partial<ShiftDraft>,
  ) {
    setWeekDays((days) =>
      days.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              shifts: day.shifts.map((shift) =>
                shift.key === key ? { ...shift, ...patch } : shift,
              ),
            },
      ),
    );
  }

  function onExport() {
    if (mode === "day") {
      if (!dayTotal.ok) return;
      const csv = dayTotalToCsv(
        dayShifts.map(toShiftInput),
        dayTotal,
        overtime?.ok ? overtime : null,
      );
      downloadCsv("work-hours-day.csv", csv);
      toolExport();
      return;
    }
    if (!weekTotal.ok) return;
    const csv = weekTotalToCsv(weekTotal, overtime?.ok ? overtime : null);
    downloadCsv("work-hours-week.csv", csv);
    toolExport();
  }

  function onReset() {
    keySeq = 0;
    if (mode === "day") {
      setDayShifts([makeShift()]);
    } else {
      setWeekDays(draftsFromWeek(fixtureWeek()));
      setActiveDay("mon");
    }
    setThreshold(DEFAULT_THRESHOLD[mode]);
    setThresholdEdited(false);
    setMultiplier("1.5");
    setHourlyRate("");
  }

  const activeWeekDay = weekDays.find((d) => d.id === activeDay)!;

  const activeTotal = mode === "day" ? dayTotal : weekTotal;

  const summaryRows: ResultRow[] = [];
  if (activeTotal.ok) {
    summaryRows.push({
      label: "Net minutes",
      value: `${activeTotal.totalNetMinutes}`,
      unit: "min",
      note: `Gross ${activeTotal.totalGrossMinutes}m − breaks ${activeTotal.totalBreakMinutes}m`,
    });
    if (overtime?.ok) {
      summaryRows.push(
        {
          label: "Regular hours",
          value: overtime.regularHours.toFixed(2),
          unit: "h",
        },
        {
          label: "Overtime hours",
          value: overtime.overtimeHours.toFixed(2),
          unit: "h",
          note: `Threshold ${overtime.thresholdHours} h @ ${overtime.overtimeMultiplier}x`,
        },
      );
      if (overtime.estimatedGrossPay !== null) {
        summaryRows.push({
          label: "Est. gross pay",
          value: overtime.estimatedGrossPay.toFixed(2),
          note: `Regular ${overtime.estimatedRegularPay?.toFixed(2)} + OT ${overtime.estimatedOvertimePay?.toFixed(2)}`,
        });
      }
    }
  }

  return (
    <div className="wh-tool calc-split">
      <div className="calc-split__layout">
      <div className="calc-split__main">
      <div
        className="wh-tool__modes"
        role="tablist"
        aria-label="Calculator mode"
        onKeyDown={(e) =>
          moveTab(e, ["day", "week"] as const, mode, selectMode)
        }
      >
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-day`}
          aria-controls={`${baseId}-panel`}
          tabIndex={mode === "day" ? 0 : -1}
          aria-selected={mode === "day"}
          className={
            mode === "day" ? "wh-tool__mode is-active" : "wh-tool__mode"
          }
          onClick={() => selectMode("day")}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-week`}
          aria-controls={`${baseId}-panel`}
          tabIndex={mode === "week" ? 0 : -1}
          aria-selected={mode === "week"}
          className={
            mode === "week" ? "wh-tool__mode is-active" : "wh-tool__mode"
          }
          onClick={() => selectMode("week")}
        >
          Week
        </button>
      </div>

      {mode === "day" ? (
        <div
          className="wh-tool__panel"
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-day`}
        >
          {dayShifts.map((shift, index) => (
            <ShiftEditor
              key={shift.key}
              shift={shift}
              title={`Shift ${index + 1}`}
              error={rowErrorFor(dayShifts, index)}
              canRemove={dayShifts.length > 1}
              onChange={(patch) => updateDayShift(shift.key, patch)}
              onRemove={() =>
                setDayShifts((rows) =>
                  rows.length <= 1
                    ? rows
                    : rows.filter((r) => r.key !== shift.key),
                )
              }
              netLabel={
                dayTotal.ok && dayTotal.shifts[index]
                  ? `Net this shift: ${formatElapsed(dayTotal.shifts[index].hours, dayTotal.shifts[index].minutes)} (elapsed ${dayTotal.shifts[index].gross.totalMinutes}m − break ${dayTotal.shifts[index].unpaidBreakMinutes}m)`
                  : undefined
              }
            />
          ))}
          <div className="wh-tool__actions no-print">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                setDayShifts((rows) => [...rows, shiftAfter(rows[rows.length - 1])])
              }
            >
              Add shift
            </button>
          </div>
        </div>
      ) : (
        <div
          className="wh-tool__panel"
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-tab-week`}
        >
          <div
            className="wh-tool__days no-print"
            role="tablist"
            aria-label="Weekday"
            onKeyDown={(e) =>
              moveTab(e, WEEKDAY_IDS, activeDay, (id) => setActiveDay(id))
            }
          >
            {weekDays.map((day) => {
              const status = dayChipStatus(day);
              return (
                <button
                  key={day.id}
                  type="button"
                  role="tab"
                  aria-label={`${WEEKDAY_LABELS[day.id]}: ${status.spoken}`}
                  tabIndex={activeDay === day.id ? 0 : -1}
                  aria-selected={activeDay === day.id}
                  data-state={status.state}
                  className={
                    activeDay === day.id
                      ? "wh-tool__day is-active"
                      : "wh-tool__day"
                  }
                  onClick={() => setActiveDay(day.id)}
                >
                  <span className="wh-tool__day-name">
                    {WEEKDAY_LABELS[day.id].slice(0, 3)}
                  </span>
                  <span className="wh-tool__day-hint" aria-hidden="true">
                    {status.text}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="wh-tool__day-title">{WEEKDAY_LABELS[activeDay]}</p>

          {activeWeekDay.shifts.length === 0 ? (
            <p className="wh-tool__muted-block">
              No shifts (day off). Add a shift to include this day in totals.
            </p>
          ) : (
            activeWeekDay.shifts.map((shift, index) => (
              <ShiftEditor
                key={shift.key}
                shift={shift}
                title={`Shift ${index + 1}`}
                error={rowErrorFor(activeWeekDay.shifts, index)}
                canRemove
                onChange={(patch) =>
                  updateWeekShift(activeDay, shift.key, patch)
                }
                onRemove={() =>
                  setWeekDays((days) =>
                    days.map((day) =>
                      day.id !== activeDay
                        ? day
                        : {
                            ...day,
                            shifts: day.shifts.filter(
                              (s) => s.key !== shift.key,
                            ),
                          },
                    ),
                  )
                }
              />
            ))
          )}

          <div className="wh-tool__actions no-print">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() =>
                setWeekDays((days) =>
                  days.map((day) =>
                    day.id !== activeDay
                      ? day
                      : {
                          ...day,
                          shifts: [
                            ...day.shifts,
                            day.shifts.length === 0
                              ? makeShift({
                                  start: "09:00",
                                  end: "17:00",
                                  breakMinutes: "0",
                                })
                              : shiftAfter(day.shifts[day.shifts.length - 1]),
                          ],
                        },
                  ),
                )
              }
            >
              Add shift
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setWeekDays(draftsFromWeek(emptyWeek()))}
            >
              Clear week
            </button>
          </div>

          {weekTotal.ok ? (
            <div className="wh-tool__week-table print-block">
              <p className="wh-tool__result-label">Week by day</p>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Net</th>
                    <th scope="col">Breaks</th>
                    <th scope="col">Decimal</th>
                  </tr>
                </thead>
                <tbody>
                  {weekTotal.days.map((day) => (
                    <tr key={day.id}>
                      <td>{day.label}</td>
                      <td>
                        {day.day
                          ? `${day.day.hours}h ${String(day.day.minutes).padStart(2, "0")}m`
                          : "Off"}
                      </td>
                      <td>{day.day ? `${day.day.totalBreakMinutes}m` : "-"}</td>
                      <td>
                        {day.day ? day.day.decimalHours.toFixed(2) : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* Narrow screens: the full answer sits below the inputs, so keep the total in view. */}
      <p className="wh-tool__mini no-print" aria-hidden="true">
        <span>{mode === "day" ? "Day total" : "Week total"}</span>
        <strong>
          {activeTotal.ok
            ? `${formatElapsed(activeTotal.hours, activeTotal.minutes)} · ${activeTotal.decimalHours.toFixed(2)} h`
            : "Check inputs"}
        </strong>
      </p>
      </div>

      <div className="calc-split__side">
      <ResultSummary
        id={`${baseId}-result`}
        label={mode === "day" ? "Daily net total" : "Weekly net total"}
        error={activeTotal.ok ? null : activeTotal.message}
        value={
          activeTotal.ok
            ? formatElapsed(activeTotal.hours, activeTotal.minutes)
            : undefined
        }
        detail={
          activeTotal.ok ? (
            <>
              Decimal hours: <strong>{activeTotal.decimalHours.toFixed(2)}</strong>
            </>
          ) : undefined
        }
        rows={summaryRows}
        assumption="Estimate only - not payroll, legal, overtime-compliance, or tax advice. Breaks are simply subtracted."
      >
        {activeTotal.ok && overtime && !overtime.ok ? (
          <p className="wh-tool__error" role="alert">
            {overtime.message}
          </p>
        ) : null}
      </ResultSummary>

      <details className="wh-tool__ot no-print">
        <summary>Overtime &amp; pay estimate (optional)</summary>
        <div className="wh-tool__fields wh-tool__fields--ot">
          <label className="wh-tool__field">
            <span>
              Regular hours per {mode === "day" ? "day" : "week"} before overtime
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={threshold}
              onChange={(e) => {
                setThreshold(e.target.value);
                setThresholdEdited(true);
              }}
            />
          </label>
          <label className="wh-tool__field">
            <span>OT multiplier</span>
            <input
              type="number"
              inputMode="decimal"
              min={1}
              step={0.1}
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
            />
          </label>
          <label className="wh-tool__field">
            <span>Hourly rate (optional)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Leave blank for hours only"
            />
          </label>
        </div>
        <p className="wh-tool__break-note">
          {mode === "day"
            ? "Day mode compares this one day with the threshold. "
            : "Week mode compares the whole week with the threshold. "}
          Threshold and multiplier are your inputs - not a claim that this OT
          rule applies in your jurisdiction. Pay figures are gross estimates
          only (no tax/deductions).
        </p>
      </details>

      <div className="wh-tool__actions no-print">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onExport}
          disabled={!activeTotal.ok}
        >
          Download CSV
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => window.print()}
        >
          Print
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset
        </button>
      </div>
      </div>
      </div>
    </div>
  );
}

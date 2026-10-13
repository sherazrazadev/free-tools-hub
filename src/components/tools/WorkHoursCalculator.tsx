import { useId, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import {
  dayTotalToCsv,
  downloadCsv,
  weekTotalToCsv,
} from "../../lib/tools/work-hours/exportCsv";
import { applyOvertime } from "../../lib/tools/work-hours/overtime";
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

function ShiftEditor({
  shift,
  title,
  canRemove,
  onChange,
  onRemove,
  netLabel,
}: {
  shift: ShiftDraft;
  title: string;
  canRemove: boolean;
  onChange: (patch: Partial<ShiftDraft>) => void;
  onRemove: () => void;
  netLabel?: string;
}) {
  return (
    <section className="wh-tool__shift">
      <div className="wh-tool__shift-head">
        <h3>{title}</h3>
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
      {netLabel ? <p className="wh-tool__row-net">{netLabel}</p> : null}
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
  const [threshold, setThreshold] = useState("40");
  const [multiplier, setMultiplier] = useState("1.5");
  const [hourlyRate, setHourlyRate] = useState("");

  const dayTotal = calculateDayTotal(dayShifts.map(toShiftInput));
  const weekTotal = calculateWeekTotal(weekInputsFromDrafts(weekDays));

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
    setThreshold("40");
    setMultiplier("1.5");
    setHourlyRate("");
  }

  const activeWeekDay = weekDays.find((d) => d.id === activeDay)!;

  return (
    <div className="wh-tool">
      <div
        className="wh-tool__modes"
        role="tablist"
        aria-label="Calculator mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "day"}
          className={
            mode === "day" ? "wh-tool__mode is-active" : "wh-tool__mode"
          }
          onClick={() => setMode("day")}
        >
          Day
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "week"}
          className={
            mode === "week" ? "wh-tool__mode is-active" : "wh-tool__mode"
          }
          onClick={() => setMode("week")}
        >
          Week
        </button>
      </div>

      {mode === "day" ? (
        <div className="wh-tool__panel">
          {dayShifts.map((shift, index) => (
            <ShiftEditor
              key={shift.key}
              shift={shift}
              title={`Shift ${index + 1}`}
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
                setDayShifts((rows) => [
                  ...rows,
                  makeShift({
                    start: "14:00",
                    end: "18:00",
                    breakMinutes: "0",
                  }),
                ])
              }
            >
              Add shift
            </button>
          </div>
        </div>
      ) : (
        <div className="wh-tool__panel">
          <div
            className="wh-tool__days no-print"
            role="tablist"
            aria-label="Weekday"
          >
            {WEEKDAY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeDay === id}
                className={
                  activeDay === id ? "wh-tool__day is-active" : "wh-tool__day"
                }
                onClick={() => setActiveDay(id)}
              >
                {WEEKDAY_LABELS[id].slice(0, 3)}
              </button>
            ))}
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
                            makeShift({
                              start: "09:00",
                              end: "17:00",
                              breakMinutes: "0",
                            }),
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
                          ? formatElapsed(day.day.hours, day.day.minutes)
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

      <details className="wh-tool__ot no-print">
        <summary>Overtime &amp; pay estimate (optional)</summary>
        <div className="wh-tool__fields wh-tool__fields--ot">
          <label className="wh-tool__field">
            <span>Regular hours threshold</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
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
          Threshold and multiplier are your inputs - not a claim that this OT
          rule applies in your jurisdiction. Pay figures are gross estimates
          only (no tax/deductions).
        </p>
      </details>

      <p className="wh-tool__break-note">
        Break minutes are a simple subtraction from elapsed time - not a legal
        deductible-break classification.
      </p>

      <div className="wh-tool__actions no-print">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onExport}
          disabled={mode === "day" ? !dayTotal.ok : !weekTotal.ok}
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

      {(mode === "day" ? !dayTotal.ok : !weekTotal.ok) ? (
        <p className="wh-tool__error" role="alert">
          {mode === "day" && !dayTotal.ok
            ? dayTotal.message
            : !weekTotal.ok
              ? weekTotal.message
              : null}
        </p>
      ) : (
        <div
          className="wh-tool__result print-block"
          aria-live="polite"
          id={`${baseId}-result`}
        >
          <p className="wh-tool__result-label">
            {mode === "day" ? "Daily net total" : "Weekly net total"}
          </p>
          <p className="wh-tool__result-main">
            {mode === "day" && dayTotal.ok
              ? formatElapsed(dayTotal.hours, dayTotal.minutes)
              : weekTotal.ok
                ? formatElapsed(weekTotal.hours, weekTotal.minutes)
                : null}
          </p>
          <p className="wh-tool__result-meta">
            {mode === "day" && dayTotal.ok ? (
              <>
                Decimal hours:{" "}
                <strong>{dayTotal.decimalHours.toFixed(2)}</strong>
                <span aria-hidden="true"> · </span>
                Gross {dayTotal.totalGrossMinutes}m − breaks{" "}
                {dayTotal.totalBreakMinutes}m = {dayTotal.totalNetMinutes}m
              </>
            ) : weekTotal.ok ? (
              <>
                Decimal hours:{" "}
                <strong>{weekTotal.decimalHours.toFixed(2)}</strong>
                <span aria-hidden="true"> · </span>
                Gross {weekTotal.totalGrossMinutes}m − breaks{" "}
                {weekTotal.totalBreakMinutes}m = {weekTotal.totalNetMinutes}m
              </>
            ) : null}
          </p>

          {overtime && !overtime.ok ? (
            <p className="wh-tool__error" role="alert">
              {overtime.message}
            </p>
          ) : null}

          {overtime?.ok ? (
            <div className="wh-tool__ot-result">
              <p>
                Regular: <strong>{overtime.regularHours.toFixed(2)} h</strong>
                <span aria-hidden="true"> · </span>
                Overtime: <strong>{overtime.overtimeHours.toFixed(2)} h</strong>
                <span className="wh-tool__muted">
                  {" "}
                  (threshold {overtime.thresholdHours}h @{" "}
                  {overtime.overtimeMultiplier}x)
                </span>
              </p>
              {overtime.estimatedGrossPay !== null ? (
                <p>
                  Est. gross pay:{" "}
                  <strong>{overtime.estimatedGrossPay.toFixed(2)}</strong>
                  <span className="wh-tool__muted">
                    {" "}
                    (regular {overtime.estimatedRegularPay?.toFixed(2)} + OT{" "}
                    {overtime.estimatedOvertimePay?.toFixed(2)})
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="wh-tool__assumption">
            Estimate only - not payroll, legal, overtime-compliance, or tax
            advice.
          </p>
        </div>
      )}
    </div>
  );
}

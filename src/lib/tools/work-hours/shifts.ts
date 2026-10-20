/**
 * Break deduction + multi-shift day totals (pure).
 * Break math is arithmetic only - not a legal “deductible break” judgment.
 */

import {
  calculateDuration,
  parseTimeToMinutes,
  type DurationError,
  type DurationInput,
  type DurationSuccess,
} from "./duration";

export type ShiftInput = DurationInput & {
  /** Unpaid break minutes to subtract from elapsed (0 = none). */
  unpaidBreakMinutes: number;
};

export type ShiftNetSuccess = {
  ok: true;
  gross: DurationSuccess;
  unpaidBreakMinutes: number;
  netMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
};

export type ShiftNetErrorCode =
  DurationError["code"] | "break_invalid" | "break_exceeds";

export type ShiftNetError = {
  ok: false;
  code: ShiftNetErrorCode;
  message: string;
};

export type ShiftNetResult = ShiftNetSuccess | ShiftNetError;

export type DayTotalSuccess = {
  ok: true;
  shifts: ShiftNetSuccess[];
  totalGrossMinutes: number;
  totalBreakMinutes: number;
  totalNetMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
};

export type DayTotalError = {
  ok: false;
  code: "empty" | "row_error" | "overlap";
  message: string;
  /** Row that caused the error (for `overlap`, the later of the two shifts). */
  rowIndex?: number;
  rowError?: ShiftNetError;
};

export type DayTotalResult = DayTotalSuccess | DayTotalError;

function fromMinutes(
  totalMinutes: number,
): Pick<ShiftNetSuccess, "hours" | "minutes" | "decimalHours" | "netMinutes"> {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    netMinutes: totalMinutes,
    hours,
    minutes,
    decimalHours: Math.round((totalMinutes / 60) * 100) / 100,
  };
}

/** Normalize unpaid break input (whole minutes, ≥ 0). */
export function normalizeBreakMinutes(value: number): number | null {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    return null;
  }
  return value;
}

/**
 * Net work minutes = elapsed − unpaid break minutes.
 * Label in UI as a mathematical deduction, not a legal break classification.
 */
export function calculateShiftWithBreak(input: ShiftInput): ShiftNetResult {
  const gross = calculateDuration({
    start: input.start,
    end: input.end,
    endsNextDay: input.endsNextDay,
  });
  if (!gross.ok) return gross;

  const breakMinutes = normalizeBreakMinutes(input.unpaidBreakMinutes);
  if (breakMinutes === null) {
    return {
      ok: false,
      code: "break_invalid",
      message: "Unpaid break must be a whole number of minutes (0 or more).",
    };
  }

  if (breakMinutes > gross.totalMinutes) {
    return {
      ok: false,
      code: "break_exceeds",
      message: "Unpaid break cannot be longer than the shift elapsed time.",
    };
  }

  const net = fromMinutes(gross.totalMinutes - breakMinutes);
  return {
    ok: true,
    gross,
    unpaidBreakMinutes: breakMinutes,
    ...net,
  };
}

/**
 * First pair of shifts whose time ranges overlap (touching ends are fine:
 * 09:00–13:00 then 13:00–17:00). Ranges are measured from the start time, so an
 * overnight shift runs past 24:00 and can clash with a later shift on the same day.
 */
function findOverlap(
  inputs: ShiftInput[],
  resolved: ShiftNetSuccess[],
): { first: number; second: number } | null {
  const ranges = inputs.map((input, i) => {
    const start = parseTimeToMinutes(input.start) ?? 0;
    return { start, end: start + resolved[i]!.gross.totalMinutes };
  });
  for (let b = 1; b < ranges.length; b++) {
    for (let a = 0; a < b; a++) {
      if (ranges[a]!.start < ranges[b]!.end && ranges[b]!.start < ranges[a]!.end) {
        return { first: a, second: b };
      }
    }
  }
  return null;
}

/** Sum net work across one or more shifts for a single day. */
export function calculateDayTotal(shifts: ShiftInput[]): DayTotalResult {
  if (shifts.length === 0) {
    return {
      ok: false,
      code: "empty",
      message: "Add at least one shift.",
    };
  }

  const resolved: ShiftNetSuccess[] = [];
  let totalGrossMinutes = 0;
  let totalBreakMinutes = 0;
  let totalNetMinutes = 0;

  for (let i = 0; i < shifts.length; i++) {
    const row = calculateShiftWithBreak(shifts[i]!);
    if (!row.ok) {
      return {
        ok: false,
        code: "row_error",
        message: `Shift ${i + 1}: ${row.message}`,
        rowIndex: i,
        rowError: row,
      };
    }
    resolved.push(row);
    totalGrossMinutes += row.gross.totalMinutes;
    totalBreakMinutes += row.unpaidBreakMinutes;
    totalNetMinutes += row.netMinutes;
  }

  const overlap = findOverlap(shifts, resolved);
  if (overlap) {
    return {
      ok: false,
      code: "overlap",
      message: `Shift ${overlap.first + 1} and shift ${overlap.second + 1} overlap, so the same time would be counted twice. Change one of them.`,
      rowIndex: overlap.second,
    };
  }

  const net = fromMinutes(totalNetMinutes);
  return {
    ok: true,
    shifts: resolved,
    totalGrossMinutes,
    totalBreakMinutes,
    totalNetMinutes,
    hours: net.hours,
    minutes: net.minutes,
    decimalHours: net.decimalHours,
  };
}

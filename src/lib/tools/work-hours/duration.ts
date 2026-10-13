/**
 * Pure work-hours duration math - no React, no I/O.
 * Inputs use native `<input type="time">` values (`HH:MM` or `HH:MM:SS`).
 */

export type DurationInput = {
  start: string;
  end: string;
  /** When true, end time is on the following calendar day. */
  endsNextDay: boolean;
};

export type DurationSuccess = {
  ok: true;
  /** Whole hours component of the elapsed duration. */
  hours: number;
  /** Remaining minutes after whole hours (0–59). */
  minutes: number;
  /** Elapsed time in decimal hours (2 d.p.). */
  decimalHours: number;
  /** Total elapsed minutes (exact). */
  totalMinutes: number;
};

export type DurationErrorCode = "missing" | "invalid" | "needs_overnight";

export type DurationError = {
  ok: false;
  code: DurationErrorCode;
  message: string;
};

export type DurationResult = DurationSuccess | DurationError;

const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Parse a time string to minutes from midnight, or null if invalid. */
export function parseTimeToMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = TIME_RE.exec(trimmed);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] !== undefined ? Number(match[3]) : 0;

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  ) {
    return null;
  }

  // Minute precision for work-hours totals; seconds round to nearest minute.
  return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

function toDecimalHours(totalMinutes: number): number {
  return Math.round((totalMinutes / 60) * 100) / 100;
}

/**
 * Elapsed duration between start and end.
 * Same-day end before start → error (no silent negative). Use `endsNextDay` for overnight.
 */
export function calculateDuration(input: DurationInput): DurationResult {
  const startRaw = input.start?.trim() ?? "";
  const endRaw = input.end?.trim() ?? "";

  if (!startRaw || !endRaw) {
    return {
      ok: false,
      code: "missing",
      message: "Enter both a start time and an end time.",
    };
  }

  const startMinutes = parseTimeToMinutes(startRaw);
  const endMinutes = parseTimeToMinutes(endRaw);

  if (startMinutes === null || endMinutes === null) {
    return {
      ok: false,
      code: "invalid",
      message: "Use a valid time (hours and minutes).",
    };
  }

  let totalMinutes = endMinutes - startMinutes;
  if (input.endsNextDay) {
    totalMinutes += 24 * 60;
  }

  if (totalMinutes < 0) {
    return {
      ok: false,
      code: "needs_overnight",
      message:
        "End time is earlier than start. Turn on “Ends next day” for overnight shifts.",
    };
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    ok: true,
    hours,
    minutes,
    decimalHours: toDecimalHours(totalMinutes),
    totalMinutes,
  };
}

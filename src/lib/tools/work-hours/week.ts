/**
 * Weekly timesheet model - seven days of shift lists → week totals.
 */

import {
  calculateDayTotal,
  type DayTotalSuccess,
  type ShiftInput,
} from "./shifts";

export const WEEKDAY_IDS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type WeekdayId = (typeof WEEKDAY_IDS)[number];

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export type WeekDayInput = {
  id: WeekdayId;
  shifts: ShiftInput[];
};

export type WeekDaySuccess = {
  id: WeekdayId;
  label: string;
  /** null when the day has no shifts (day off). */
  day: DayTotalSuccess | null;
};

export type WeekTotalSuccess = {
  ok: true;
  days: WeekDaySuccess[];
  totalGrossMinutes: number;
  totalBreakMinutes: number;
  totalNetMinutes: number;
  hours: number;
  minutes: number;
  decimalHours: number;
};

export type WeekTotalError = {
  ok: false;
  code: "day_error";
  message: string;
  dayId: WeekdayId;
};

export type WeekTotalResult = WeekTotalSuccess | WeekTotalError;

function fromMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours,
    minutes,
    decimalHours: Math.round((totalMinutes / 60) * 100) / 100,
  };
}

/** Empty week scaffold (all days off). */
export function emptyWeek(): WeekDayInput[] {
  return WEEKDAY_IDS.map((id) => ({ id, shifts: [] }));
}

/**
 * Fixture week for tests / demos:
 * Mon 09:00–17:30 − 30m break → 8h net
 * Tue–Fri 09:00–17:00 − 0 break → 8h each
 * Sat–Sun off
 * Week net = 40h
 */
export function fixtureWeek(): WeekDayInput[] {
  const weekdayShift = (end: string, breakMin: number): ShiftInput[] => [
    {
      start: "09:00",
      end,
      endsNextDay: false,
      unpaidBreakMinutes: breakMin,
    },
  ];

  return [
    { id: "mon", shifts: weekdayShift("17:30", 30) },
    { id: "tue", shifts: weekdayShift("17:00", 0) },
    { id: "wed", shifts: weekdayShift("17:00", 0) },
    { id: "thu", shifts: weekdayShift("17:00", 0) },
    { id: "fri", shifts: weekdayShift("17:00", 0) },
    { id: "sat", shifts: [] },
    { id: "sun", shifts: [] },
  ];
}

export function calculateWeekTotal(days: WeekDayInput[]): WeekTotalResult {
  const resolved: WeekDaySuccess[] = [];
  let totalGrossMinutes = 0;
  let totalBreakMinutes = 0;
  let totalNetMinutes = 0;

  for (const dayInput of days) {
    const label = WEEKDAY_LABELS[dayInput.id];

    if (dayInput.shifts.length === 0) {
      resolved.push({ id: dayInput.id, label, day: null });
      continue;
    }

    const day = calculateDayTotal(dayInput.shifts);
    if (!day.ok) {
      return {
        ok: false,
        code: "day_error",
        message: `${label}: ${day.message}`,
        dayId: dayInput.id,
      };
    }

    resolved.push({ id: dayInput.id, label, day });
    totalGrossMinutes += day.totalGrossMinutes;
    totalBreakMinutes += day.totalBreakMinutes;
    totalNetMinutes += day.totalNetMinutes;
  }

  const net = fromMinutes(totalNetMinutes);
  return {
    ok: true,
    days: resolved,
    totalGrossMinutes,
    totalBreakMinutes,
    totalNetMinutes,
    ...net,
  };
}

/**
 * Pure freelancer rate planning math.
 * Results are estimates - not tax, income guarantees, or legal advice.
 */

export type FreelancerRateInput = {
  /** Desired take-home / target annual income (before adding expenses & margin). */
  targetIncome: number;
  /** Working weeks per year (billable weeks). */
  weeks: number;
  /** Billable hours per working week. */
  hoursPerWeek: number;
  /** Annual business expenses to cover. */
  expenses: number;
  /**
   * Optional reserve / margin percent (0–99).
   * Applied so required billings = (income + expenses) / (1 − margin/100).
   */
  marginPercent: number;
  /**
   * Assumed billable days per week for daily rate (default 5).
   * Daily rate = hourly × (hoursPerWeek / daysPerWeek).
   */
  daysPerWeek?: number;
};

export type FreelancerRateSuccess = {
  ok: true;
  annualBillableHours: number;
  /** Income + expenses before margin uplift. */
  baseNeed: number;
  /** Amount that must be billed after margin reserve. */
  requiredBillings: number;
  hourlyRate: number;
  dailyRate: number;
  hoursPerDay: number;
  daysPerWeek: number;
  marginPercent: number;
  formulas: {
    billableHours: string;
    requiredBillings: string;
    hourly: string;
    daily: string;
  };
};

export type FreelancerRateError = {
  ok: false;
  code: "invalid" | "zero_hours" | "margin";
  message: string;
};

export type FreelancerRateResult = FreelancerRateSuccess | FreelancerRateError;

export type ScenarioRow = {
  label: string;
  marginPercent: number;
  requiredBillings: number;
  hourlyRate: number;
  dailyRate: number;
};

function isNonNegFinite(n: number): boolean {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function round(value: number, places: number): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/**
 * Estimate required hourly and daily rates from income goals and capacity.
 */
export function calculateFreelancerRate(
  input: FreelancerRateInput,
): FreelancerRateResult {
  const {
    targetIncome,
    weeks,
    hoursPerWeek,
    expenses,
    marginPercent,
    daysPerWeek: daysRaw,
  } = input;

  if (
    !isNonNegFinite(targetIncome) ||
    !isNonNegFinite(weeks) ||
    !isNonNegFinite(hoursPerWeek) ||
    !isNonNegFinite(expenses) ||
    !isNonNegFinite(marginPercent)
  ) {
    return {
      ok: false,
      code: "invalid",
      message:
        "Enter non-negative numbers for income, weeks, billable hours, expenses, and margin.",
    };
  }

  if (marginPercent >= 100) {
    return {
      ok: false,
      code: "margin",
      message:
        "Margin must be less than 100% (otherwise required billings are undefined).",
    };
  }

  const daysPerWeek = daysRaw === undefined ? 5 : daysRaw;
  if (!isNonNegFinite(daysPerWeek) || daysPerWeek <= 0) {
    return {
      ok: false,
      code: "invalid",
      message: "Days per week must be a positive number.",
    };
  }

  const annualBillableHours = weeks * hoursPerWeek;
  if (annualBillableHours <= 0) {
    return {
      ok: false,
      code: "zero_hours",
      message:
        "Cannot calculate rates when annual billable hours are zero (weeks × hours/week).",
    };
  }

  const baseNeed = round(targetIncome + expenses, 2);
  const marginFraction = marginPercent / 100;
  const requiredBillings = round(baseNeed / (1 - marginFraction), 2);
  const hoursPerDay = round(hoursPerWeek / daysPerWeek, 2);
  // Round hourly first so daily matches the displayed hourly × hours/day.
  const hourlyRate = round(requiredBillings / annualBillableHours, 2);
  const dailyRate = round(hourlyRate * hoursPerDay, 2);

  return {
    ok: true,
    annualBillableHours: round(annualBillableHours, 2),
    baseNeed,
    requiredBillings,
    hourlyRate,
    dailyRate,
    hoursPerDay,
    daysPerWeek: round(daysPerWeek, 2),
    marginPercent: round(marginPercent, 2),
    formulas: {
      billableHours: "Annual billable hours = Weeks × Billable hours per week",
      requiredBillings:
        "Required billings = (Target income + Expenses) / (1 − Margin%)",
      hourly: "Hourly rate = Required billings / Annual billable hours",
      daily: "Daily rate = Hourly rate × (Hours per week / Days per week)",
    },
  };
}

/** Compare the same inputs at several margin levels (planning scenarios). */
export function compareMarginScenarios(
  input: Omit<FreelancerRateInput, "marginPercent">,
  margins: readonly number[] = [0, 10, 20],
): ScenarioRow[] {
  const rows: ScenarioRow[] = [];
  for (const marginPercent of margins) {
    const result = calculateFreelancerRate({ ...input, marginPercent });
    if (!result.ok) continue;
    rows.push({
      label: `${marginPercent}% margin`,
      marginPercent,
      requiredBillings: result.requiredBillings,
      hourlyRate: result.hourlyRate,
      dailyRate: result.dailyRate,
    });
  }
  return rows;
}

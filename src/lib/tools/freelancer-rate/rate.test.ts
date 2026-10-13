import { describe, expect, it } from "vitest";
import { calculateFreelancerRate, compareMarginScenarios } from "./rate";

/** Worked example used on the SEO page - keep in sync with freelancer-rate.astro */
export const WORKED_EXAMPLE = {
  targetIncome: 60_000,
  weeks: 48,
  hoursPerWeek: 25,
  expenses: 8_000,
  marginPercent: 15,
  daysPerWeek: 5,
} as const;

describe("calculateFreelancerRate", () => {
  it("matches the published worked example", () => {
    const r = calculateFreelancerRate(WORKED_EXAMPLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // billable = 48 * 25 = 1200
    expect(r.annualBillableHours).toBe(1200);
    // base = 68000; required = 68000 / 0.85 = 80000
    expect(r.baseNeed).toBe(68_000);
    expect(r.requiredBillings).toBe(80_000);
    // hourly = 80000 / 1200 ≈ 66.666… → 66.67
    expect(r.hourlyRate).toBe(66.67);
    // hours/day = 5; daily = 66.67 * 5 = 333.35
    expect(r.hoursPerDay).toBe(5);
    expect(r.dailyRate).toBe(333.35);
  });

  it("with zero margin equals income + expenses over hours", () => {
    const r = calculateFreelancerRate({
      targetIncome: 50_000,
      weeks: 50,
      hoursPerWeek: 20,
      expenses: 0,
      marginPercent: 0,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.requiredBillings).toBe(50_000);
    expect(r.hourlyRate).toBe(50); // 50000 / 1000
  });

  it("rejects zero billable hours", () => {
    const r = calculateFreelancerRate({
      ...WORKED_EXAMPLE,
      weeks: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("zero_hours");
  });

  it("rejects margin >= 100", () => {
    const r = calculateFreelancerRate({
      ...WORKED_EXAMPLE,
      marginPercent: 100,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("margin");
  });

  it("rejects negative inputs", () => {
    const r = calculateFreelancerRate({
      ...WORKED_EXAMPLE,
      expenses: -1,
    });
    expect(r.ok).toBe(false);
  });
});

describe("compareMarginScenarios", () => {
  it("returns rising rates as margin increases", () => {
    const rows = compareMarginScenarios({
      targetIncome: WORKED_EXAMPLE.targetIncome,
      weeks: WORKED_EXAMPLE.weeks,
      hoursPerWeek: WORKED_EXAMPLE.hoursPerWeek,
      expenses: WORKED_EXAMPLE.expenses,
      daysPerWeek: WORKED_EXAMPLE.daysPerWeek,
    });
    expect(rows.length).toBe(3);
    expect(rows[0].hourlyRate).toBeLessThan(rows[1].hourlyRate);
    expect(rows[1].hourlyRate).toBeLessThan(rows[2].hourlyRate);
  });
});

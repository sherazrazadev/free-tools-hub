/**
 * Pure advertising metrics - CPM, CPC, CTR, CPA, conversion rate, ROAS.
 * Zero denominators never yield Infinity; ROAS requires spend > 0.
 */

export type AdsInputs = {
  /** Advertising spend (same currency as revenue). */
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  /** Attributed revenue (same currency as spend). */
  revenue: number;
};

export type MetricUnit =
  "currency" | "ratio" | "percent" | "currency_per_mille";

export type MetricSuccess = {
  ok: true;
  value: number;
  /** Display string for the numeric value. */
  display: string;
  unit: MetricUnit;
  formula: string;
  definition: string;
};

export type MetricUnavailable = {
  ok: false;
  formula: string;
  definition: string;
  reason: string;
};

export type MetricResult = MetricSuccess | MetricUnavailable;

export type AdsMetricsResult =
  | {
      ok: true;
      cpm: MetricResult;
      cpc: MetricResult;
      ctr: MetricResult;
      cpa: MetricResult;
      conversionRate: MetricResult;
      roas: MetricResult;
    }
  | { ok: false; code: "invalid"; message: string };

const FORMULAS = {
  cpm: "CPM = (Spend / Impressions) × 1000",
  cpc: "CPC = Spend / Clicks",
  ctr: "CTR = Clicks / Impressions",
  cpa: "CPA = Spend / Conversions",
  conversionRate: "Conversion rate = Conversions / Clicks",
  roas: "ROAS = Attributed Revenue / Advertising Spend",
} as const;

const DEFINITIONS = {
  cpm: "Cost per thousand impressions - average spend for 1,000 ad views.",
  cpc: "Cost per click - average spend for each click.",
  ctr: "Click-through rate - share of impressions that became clicks.",
  cpa: "Cost per acquisition - average spend for each conversion.",
  conversionRate: "Share of clicks that became conversions.",
  roas: "Return on ad spend - attributed revenue per unit of advertising spend (not profit or overall ROI).",
} as const;

function isNonNegFinite(n: number): boolean {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function round(value: number, places: number): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

function formatNumber(value: number, places: number): string {
  return round(value, places).toFixed(places);
}

function unavailable(
  key: keyof typeof FORMULAS,
  reason: string,
): MetricUnavailable {
  return {
    ok: false,
    formula: FORMULAS[key],
    definition: DEFINITIONS[key],
    reason,
  };
}

function success(
  key: keyof typeof FORMULAS,
  value: number,
  unit: MetricUnit,
  places: number,
): MetricSuccess {
  return {
    ok: true,
    value: round(value, places),
    display: formatNumber(value, places),
    unit,
    formula: FORMULAS[key],
    definition: DEFINITIONS[key],
  };
}

/**
 * Validate raw inputs and compute all advertising metrics.
 * Missing/invalid numbers fail the whole calculation; zero denominators make individual metrics unavailable.
 */
export function calculateAdsMetrics(input: AdsInputs): AdsMetricsResult {
  const { spend, impressions, clicks, conversions, revenue } = input;

  if (
    !isNonNegFinite(spend) ||
    !isNonNegFinite(impressions) ||
    !isNonNegFinite(clicks) ||
    !isNonNegFinite(conversions) ||
    !isNonNegFinite(revenue)
  ) {
    return {
      ok: false,
      code: "invalid",
      message:
        "Enter non-negative numbers for spend, impressions, clicks, conversions, and revenue.",
    };
  }

  // Soft sanity: clicks cannot exceed impressions; conversions cannot exceed clicks.
  if (impressions > 0 && clicks > impressions) {
    return {
      ok: false,
      code: "invalid",
      message: "Clicks cannot be greater than impressions.",
    };
  }
  if (clicks > 0 && conversions > clicks) {
    return {
      ok: false,
      code: "invalid",
      message: "Conversions cannot be greater than clicks.",
    };
  }

  const cpm: MetricResult =
    impressions > 0
      ? success("cpm", (spend / impressions) * 1000, "currency_per_mille", 4)
      : unavailable("cpm", "Cannot calculate CPM when impressions are zero.");

  const cpc: MetricResult =
    clicks > 0
      ? success("cpc", spend / clicks, "currency", 4)
      : unavailable("cpc", "Cannot calculate CPC when clicks are zero.");

  const ctr: MetricResult =
    impressions > 0
      ? success("ctr", clicks / impressions, "percent", 4)
      : unavailable("ctr", "Cannot calculate CTR when impressions are zero.");

  const cpa: MetricResult =
    conversions > 0
      ? success("cpa", spend / conversions, "currency", 4)
      : unavailable("cpa", "Cannot calculate CPA when conversions are zero.");

  const conversionRate: MetricResult =
    clicks > 0
      ? success("conversionRate", conversions / clicks, "percent", 4)
      : unavailable(
          "conversionRate",
          "Cannot calculate conversion rate when clicks are zero.",
        );

  const roas: MetricResult =
    spend > 0
      ? success("roas", revenue / spend, "ratio", 4)
      : unavailable(
          "roas",
          "Cannot calculate ROAS when advertising spend is zero (would be undefined / infinite).",
        );

  return {
    ok: true,
    cpm,
    cpc,
    ctr,
    cpa,
    conversionRate,
    roas,
  };
}

export { FORMULAS, DEFINITIONS };

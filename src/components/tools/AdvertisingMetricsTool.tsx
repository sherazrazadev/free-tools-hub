import { useId, useMemo, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import {
  calculateAdsMetrics,
  type MetricResult,
} from "../../lib/tools/advertising-metrics/metrics";
import ResultSummary, { type ResultRow } from "../ui/ResultSummary";
import "../../styles/islands/AdvertisingMetricsTool.css";

type FieldKey = "spend" | "impressions" | "clicks" | "conversions" | "revenue";

const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
  {
    key: "spend",
    label: "Advertising spend",
    hint: "Currency amount spent on ads",
  },
  { key: "impressions", label: "Impressions", hint: "Ad views / serves" },
  { key: "clicks", label: "Clicks", hint: "Must be ≤ impressions" },
  { key: "conversions", label: "Conversions", hint: "Must be ≤ clicks" },
  {
    key: "revenue",
    label: "Attributed revenue",
    hint: "Same currency as spend",
  },
];

function parseNonNeg(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function formatMetricValue(metric: MetricResult): string {
  if (!metric.ok) return "-";
  if (metric.unit === "percent") {
    return `${(metric.value * 100).toFixed(2)}%`;
  }
  // Two decimals read cleanly; keep the library's precision for tiny values.
  const text =
    Math.abs(metric.value) >= 0.01 ? metric.value.toFixed(2) : metric.display;
  if (metric.unit === "ratio") {
    return `${text}×`;
  }
  return text;
}

/** A supporting metric as a summary row: value (or why it is unavailable) + formula. */
function metricRow(title: string, metric: MetricResult): ResultRow {
  return {
    label: title,
    value: metric.ok ? formatMetricValue(metric) : "n/a",
    // Formula lives in "What each metric means"; the row only explains why a value is n/a.
    note: metric.ok ? undefined : `${metric.reason} (${metric.formula})`,
  };
}

/**
 * Advertising metrics calculator - CPM, CPC, CTR, CPA, conversion rate, ROAS.
 */
export default function AdvertisingMetricsTool() {
  const baseId = useId();
  useToolAnalytics("advertising-metrics");
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    spend: "100",
    impressions: "50000",
    clicks: "500",
    conversions: "25",
    revenue: "400",
  });

  const parsed = useMemo(() => {
    const spend = parseNonNeg(fields.spend);
    const impressions = parseNonNeg(fields.impressions);
    const clicks = parseNonNeg(fields.clicks);
    const conversions = parseNonNeg(fields.conversions);
    const revenue = parseNonNeg(fields.revenue);
    if (
      spend === null ||
      impressions === null ||
      clicks === null ||
      conversions === null ||
      revenue === null
    ) {
      return null;
    }
    return { spend, impressions, clicks, conversions, revenue };
  }, [fields]);

  const result = useMemo(
    () => (parsed ? calculateAdsMetrics(parsed) : null),
    [parsed],
  );

  function onChange(key: FieldKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function resetExample() {
    setFields({
      spend: "100",
      impressions: "50000",
      clicks: "500",
      conversions: "25",
      revenue: "400",
    });
  }

  const inputError = !parsed
    ? "Enter non-negative numbers in every field."
    : result && !result.ok
      ? result.message
      : null;

  return (
    <div className="am-tool calc-split">
      <div className="calc-split__layout">
        <div className="calc-split__main">
          <p className="am-tool__disclaimer">
            Planning estimates only - not investment, tax, accounting, or legal
            advice. ROAS is not profit and is not overall ROI.
          </p>

          <div className="am-tool__fields">
            {FIELDS.map((field) => {
              const invalid = parseNonNeg(fields[field.key]) === null;
              return (
                <label key={field.key} className="am-tool__field">
                  <span>{field.label}</span>
                  <input
                    id={`${baseId}-${field.key}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="any"
                    value={fields[field.key]}
                    aria-invalid={invalid || undefined}
                    aria-describedby={`${baseId}-${field.key}-hint`}
                    onChange={(e) => onChange(field.key, e.target.value)}
                  />
                  <span
                    id={`${baseId}-${field.key}-hint`}
                    className="am-tool__hint"
                  >
                    {field.hint}
                  </span>
                </label>
              );
            })}
          </div>

          <div className="am-tool__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={resetExample}
            >
              Reset example
            </button>
          </div>
        </div>

        <div className="calc-split__side">
          {result?.ok ? (
            <ResultSummary
              label="Return on ad spend (ROAS)"
              value={result.roas.ok ? formatMetricValue(result.roas) : "n/a"}
              detail={
                result.roas.ok
                  ? result.roas.formula
                  : `${result.roas.reason} (${result.roas.formula})`
              }
              rows={[
                metricRow("CPM", result.cpm),
                metricRow("CPC", result.cpc),
                metricRow("CTR", result.ctr),
                metricRow("CPA", result.cpa),
                metricRow("Conversion rate", result.conversionRate),
              ]}
              assumption="Based only on the five numbers you entered. Planning estimate; ROAS is not profit."
            >
              <details className="result-summary__more">
                <summary>What each metric means</summary>
                <dl>
                  {(
                    [
                      ["ROAS", result.roas],
                      ["CPM", result.cpm],
                      ["CPC", result.cpc],
                      ["CTR", result.ctr],
                      ["CPA", result.cpa],
                      ["Conversion rate", result.conversionRate],
                    ] as const
                  ).map(([name, metric]) => (
                    <div key={name}>
                      <dt>{name}</dt>
                      <dd>
                        {metric.definition}
                        <br />
                        <span className="result-summary__formula">
                          Formula: {metric.formula}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </details>
            </ResultSummary>
          ) : (
            <ResultSummary
              label="Return on ad spend (ROAS)"
              error={inputError ?? "Enter your campaign numbers."}
            />
          )}
        </div>
      </div>
    </div>
  );
}

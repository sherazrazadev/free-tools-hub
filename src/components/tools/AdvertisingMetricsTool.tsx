import { useId, useMemo, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import {
  calculateAdsMetrics,
  type MetricResult,
} from "../../lib/tools/advertising-metrics/metrics";
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
  if (metric.unit === "ratio") {
    return `${metric.display}×`;
  }
  return metric.display;
}

function MetricCard({
  title,
  metric,
}: {
  title: string;
  metric: MetricResult;
}) {
  return (
    <article className="am-tool__metric">
      <h3>{title}</h3>
      <p className="am-tool__definition">{metric.definition}</p>
      {metric.ok ? (
        <p className="am-tool__value">
          <strong>{formatMetricValue(metric)}</strong>
        </p>
      ) : (
        <p className="am-tool__unavailable" role="status">
          {metric.reason}
        </p>
      )}
      <p className="am-tool__formula">
        <span className="am-tool__formula-label">Formula</span> {metric.formula}
      </p>
    </article>
  );
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

  return (
    <div className="am-tool">
      <p className="am-tool__disclaimer">
        Planning estimates only - not investment, tax, accounting, or legal
        advice. ROAS is not profit and is not overall ROI.
      </p>

      <div className="am-tool__fields">
        {FIELDS.map((field) => (
          <label key={field.key} className="am-tool__field">
            <span>{field.label}</span>
            <input
              id={`${baseId}-${field.key}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={fields[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
            <span className="am-tool__hint">{field.hint}</span>
          </label>
        ))}
      </div>

      <div className="am-tool__actions">
        <button type="button" className="btn btn--ghost" onClick={resetExample}>
          Reset example
        </button>
      </div>

      {!parsed ? (
        <p className="am-tool__error" role="alert">
          Enter non-negative numbers in every field.
        </p>
      ) : null}

      {result && !result.ok ? (
        <p className="am-tool__error" role="alert">
          {result.message}
        </p>
      ) : null}

      {result?.ok ? (
        <div className="am-tool__results" aria-live="polite">
          <MetricCard title="CPM" metric={result.cpm} />
          <MetricCard title="CPC" metric={result.cpc} />
          <MetricCard title="CTR" metric={result.ctr} />
          <MetricCard title="CPA" metric={result.cpa} />
          <MetricCard title="Conversion rate" metric={result.conversionRate} />
          <MetricCard title="ROAS" metric={result.roas} />
        </div>
      ) : null}
    </div>
  );
}

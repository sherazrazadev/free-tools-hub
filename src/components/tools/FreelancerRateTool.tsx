import { useId, useMemo, useState } from "react";
import { useToolAnalytics } from "../../lib/analytics/useToolAnalytics";
import {
  calculateFreelancerRate,
  compareMarginScenarios,
} from "../../lib/tools/freelancer-rate/rate";
import "../../styles/islands/FreelancerRateTool.css";

type FieldKey =
  | "targetIncome"
  | "weeks"
  | "hoursPerWeek"
  | "expenses"
  | "marginPercent"
  | "daysPerWeek";

const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
  {
    key: "targetIncome",
    label: "Target annual income",
    hint: "Desired yearly take-home goal",
  },
  {
    key: "weeks",
    label: "Working weeks / year",
    hint: "Weeks you expect to bill",
  },
  {
    key: "hoursPerWeek",
    label: "Billable hours / week",
    hint: "Client hours, not total wake time",
  },
  {
    key: "expenses",
    label: "Annual business expenses",
    hint: "Software, insurance, gear, etc.",
  },
  {
    key: "marginPercent",
    label: "Reserve / margin %",
    hint: "0–99; buffer above income + expenses",
  },
  {
    key: "daysPerWeek",
    label: "Billable days / week",
    hint: "Used only for daily rate (default 5)",
  },
];

function parseNonNeg(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function money(n: number): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Freelancer rate planner - income, capacity, expenses, margin → hourly/daily.
 */
export default function FreelancerRateTool() {
  const baseId = useId();
  useToolAnalytics("freelancer-rate");
  const [fields, setFields] = useState<Record<FieldKey, string>>({
    targetIncome: "60000",
    weeks: "48",
    hoursPerWeek: "25",
    expenses: "8000",
    marginPercent: "15",
    daysPerWeek: "5",
  });

  const parsed = useMemo(() => {
    const targetIncome = parseNonNeg(fields.targetIncome);
    const weeks = parseNonNeg(fields.weeks);
    const hoursPerWeek = parseNonNeg(fields.hoursPerWeek);
    const expenses = parseNonNeg(fields.expenses);
    const marginPercent = parseNonNeg(fields.marginPercent);
    const daysPerWeek = parseNonNeg(fields.daysPerWeek);
    if (
      targetIncome === null ||
      weeks === null ||
      hoursPerWeek === null ||
      expenses === null ||
      marginPercent === null ||
      daysPerWeek === null
    ) {
      return null;
    }
    return {
      targetIncome,
      weeks,
      hoursPerWeek,
      expenses,
      marginPercent,
      daysPerWeek,
    };
  }, [fields]);

  const result = useMemo(
    () => (parsed ? calculateFreelancerRate(parsed) : null),
    [parsed],
  );

  const scenarios = useMemo(() => {
    if (!parsed) return [];
    const { marginPercent: _m, ...rest } = parsed;
    return compareMarginScenarios(rest);
  }, [parsed]);

  function onChange(key: FieldKey, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function resetExample() {
    setFields({
      targetIncome: "60000",
      weeks: "48",
      hoursPerWeek: "25",
      expenses: "8000",
      marginPercent: "15",
      daysPerWeek: "5",
    });
  }

  return (
    <div className="fr-tool">
      <p className="fr-tool__disclaimer">
        <strong>Planning estimate only</strong> - not a guarantee of income, and
        not a tax, payroll, or legal calculation. Adjust for your market, taxes,
        and non-billable time.
      </p>

      <div className="fr-tool__fields">
        {FIELDS.map((field) => (
          <label key={field.key} className="fr-tool__field">
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
            <span className="fr-tool__hint">{field.hint}</span>
          </label>
        ))}
      </div>

      <div className="fr-tool__actions">
        <button type="button" className="btn btn--ghost" onClick={resetExample}>
          Reset example
        </button>
      </div>

      {!parsed ? (
        <p className="fr-tool__error" role="alert">
          Enter non-negative numbers in every field.
        </p>
      ) : null}

      {result && !result.ok ? (
        <p className="fr-tool__error" role="alert">
          {result.message}
        </p>
      ) : null}

      {result?.ok ? (
        <div className="fr-tool__results" aria-live="polite">
          <p className="fr-tool__stat">
            Annual billable hours:{" "}
            <strong>{result.annualBillableHours.toLocaleString()}</strong>
          </p>
          <p className="fr-tool__stat">
            Required annual billings:{" "}
            <strong>{money(result.requiredBillings)}</strong>
            <span className="fr-tool__muted">
              {" "}
              (income + expenses
              {result.marginPercent > 0
                ? `, with ${result.marginPercent}% margin`
                : ""}
              )
            </span>
          </p>
          <p className="fr-tool__stat fr-tool__stat--hero">
            Hourly rate: <strong>{money(result.hourlyRate)}</strong>
          </p>
          <p className="fr-tool__stat fr-tool__stat--hero">
            Daily rate: <strong>{money(result.dailyRate)}</strong>
            <span className="fr-tool__muted">
              {" "}
              ({result.hoursPerDay} h/day × {result.daysPerWeek} days/week)
            </span>
          </p>

          <ul className="fr-tool__formulas">
            <li>{result.formulas.billableHours}</li>
            <li>{result.formulas.requiredBillings}</li>
            <li>{result.formulas.hourly}</li>
            <li>{result.formulas.daily}</li>
          </ul>

          {scenarios.length > 0 ? (
            <div className="fr-tool__scenarios">
              <h3>Margin scenarios</h3>
              <p className="fr-tool__muted">
                Same capacity and costs; only the reserve % changes.
              </p>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Scenario</th>
                    <th scope="col">Billings</th>
                    <th scope="col">Hourly</th>
                    <th scope="col">Daily</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((row) => (
                    <tr key={row.marginPercent}>
                      <td>{row.label}</td>
                      <td>{money(row.requiredBillings)}</td>
                      <td>{money(row.hourlyRate)}</td>
                      <td>{money(row.dailyRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

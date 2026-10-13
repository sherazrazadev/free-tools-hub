import { useState } from "react";
import "../../styles/islands/TemplateDemoTool.css";

/**
 * Stub island for ToolLayout demo only (noindex page).
 * Not a product tool - proves the React island slot pattern.
 */
export default function TemplateDemoTool() {
  const [a, setA] = useState("8");
  const [b, setB] = useState("1.5");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onCalculate() {
    const left = Number(a);
    const right = Number(b);
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      setResult(null);
      setError("Enter valid numbers for both fields.");
      return;
    }
    setError(null);
    setResult(String(left + right));
  }

  function onReset() {
    setA("8");
    setB("1.5");
    setResult(null);
    setError(null);
  }

  return (
    <div className="demo-tool">
      <p className="demo-tool__label">
        Template demo (not a published product tool)
      </p>
      <div className="demo-tool__fields">
        <label>
          <span>Value A</span>
          <input
            type="text"
            inputMode="decimal"
            value={a}
            onChange={(e) => setA(e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          <span>Value B</span>
          <input
            type="text"
            inputMode="decimal"
            value={b}
            onChange={(e) => setB(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>
      <div className="demo-tool__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onCalculate}
        >
          Calculate
        </button>
        <button type="button" className="btn btn--ghost" onClick={onReset}>
          Reset
        </button>
      </div>
      {error ? (
        <p className="demo-tool__error" role="alert">
          {error}
        </p>
      ) : null}
      {result !== null ? (
        <p className="demo-tool__result" aria-live="polite">
          Result: <strong>{result}</strong>
        </p>
      ) : null}
    </div>
  );
}

import type { ReactNode } from 'react';
import '../../styles/islands/ResultSummary.css';

export type ResultRow = {
	label: string;
	value: string;
	unit?: string;
	/** Small muted line under the row (formula, basis). */
	note?: string;
};

export type ResultSummaryProps = {
	/** What the headline number is, e.g. "Daily net total". */
	label: string;
	value?: string;
	unit?: string;
	/** One supporting line under the headline. */
	detail?: ReactNode;
	rows?: ResultRow[];
	/** The assumption / caveat that goes with this answer. */
	assumption?: ReactNode;
	/** When set, replaces the answer with an inline error (never toast-only). */
	error?: string | null;
	children?: ReactNode;
	className?: string;
	id?: string;
};

/**
 * Calculator answer block: headline value + unit, supporting rows, assumption.
 * Shared by every calculator so results look and behave the same.
 */
export default function ResultSummary({
	label,
	value,
	unit,
	detail,
	rows,
	assumption,
	error = null,
	children,
	className,
	id,
}: ResultSummaryProps) {
	if (error) {
		return (
			<section
				id={id}
				className={['result-summary', 'result-summary--error', 'print-block', className]
					.filter(Boolean)
					.join(' ')}
				aria-label={label}
			>
				<p className="result-summary__label">{label}</p>
				<p className="result-summary__message" role="alert">
					{error}
				</p>
			</section>
		);
	}

	return (
		<section
			id={id}
			className={['result-summary', 'print-block', className].filter(Boolean).join(' ')}
			aria-label={label}
			aria-live="polite"
		>
			<p className="result-summary__label">{label}</p>
			<p className="result-summary__value">
				<strong>{value ?? '–'}</strong>
				{unit ? <span className="result-summary__unit">{unit}</span> : null}
			</p>
			{detail ? <p className="result-summary__detail">{detail}</p> : null}

			{rows && rows.length > 0 ? (
				<dl className="result-summary__list">
					{rows.map((row) => (
						<div className="result-summary__row" key={row.label}>
							<dt>{row.label}</dt>
							<dd>
								<strong>{row.value}</strong>
								{row.unit ? <span className="result-summary__row-unit"> {row.unit}</span> : null}
							</dd>
							{row.note ? <dd className="result-summary__note">{row.note}</dd> : null}
						</div>
					))}
				</dl>
			) : null}

			{children}

			{assumption ? <p className="result-summary__assumption">{assumption}</p> : null}
		</section>
	);
}

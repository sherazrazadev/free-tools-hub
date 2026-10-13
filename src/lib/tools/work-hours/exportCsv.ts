/**
 * Client-side CSV builders for day / week timesheet totals.
 */

import type { DayTotalSuccess, ShiftInput } from './shifts';
import type { WeekTotalSuccess } from './week';
import { WEEKDAY_LABELS } from './week';
import type { OvertimeSuccess } from './overtime';

function csvEscape(value: string | number): string {
	const text = String(value);
	if (/[",\n]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function row(cells: Array<string | number>): string {
	return cells.map(csvEscape).join(',');
}

export function dayTotalToCsv(
	shifts: ShiftInput[],
	day: DayTotalSuccess,
	overtime?: OvertimeSuccess | null,
): string {
	const lines: string[] = [];
	lines.push(row(['shift', 'start', 'end', 'ends_next_day', 'unpaid_break_minutes', 'gross_minutes', 'net_minutes']));

	day.shifts.forEach((shift, index) => {
		const input = shifts[index]!;
		lines.push(
			row([
				index + 1,
				input.start,
				input.end,
				input.endsNextDay ? 'yes' : 'no',
				shift.unpaidBreakMinutes,
				shift.gross.totalMinutes,
				shift.netMinutes,
			]),
		);
	});

	lines.push('');
	lines.push(row(['metric', 'value']));
	lines.push(row(['total_gross_minutes', day.totalGrossMinutes]));
	lines.push(row(['total_break_minutes', day.totalBreakMinutes]));
	lines.push(row(['total_net_minutes', day.totalNetMinutes]));
	lines.push(row(['decimal_hours', day.decimalHours.toFixed(2)]));

	if (overtime) {
		lines.push(row(['regular_hours', overtime.regularHours.toFixed(2)]));
		lines.push(row(['overtime_hours', overtime.overtimeHours.toFixed(2)]));
		if (overtime.estimatedGrossPay !== null) {
			lines.push(row(['estimated_gross_pay', overtime.estimatedGrossPay.toFixed(2)]));
		}
	}

	return `${lines.join('\n')}\n`;
}

export function weekTotalToCsv(
	week: WeekTotalSuccess,
	overtime?: OvertimeSuccess | null,
): string {
	const lines: string[] = [];
	lines.push(
		row([
			'day',
			'gross_minutes',
			'break_minutes',
			'net_minutes',
			'decimal_hours',
		]),
	);

	for (const day of week.days) {
		if (!day.day) {
			lines.push(row([WEEKDAY_LABELS[day.id], 0, 0, 0, '0.00']));
			continue;
		}
		lines.push(
			row([
				WEEKDAY_LABELS[day.id],
				day.day.totalGrossMinutes,
				day.day.totalBreakMinutes,
				day.day.totalNetMinutes,
				day.day.decimalHours.toFixed(2),
			]),
		);
	}

	lines.push('');
	lines.push(row(['metric', 'value']));
	lines.push(row(['week_gross_minutes', week.totalGrossMinutes]));
	lines.push(row(['week_break_minutes', week.totalBreakMinutes]));
	lines.push(row(['week_net_minutes', week.totalNetMinutes]));
	lines.push(row(['week_decimal_hours', week.decimalHours.toFixed(2)]));

	if (overtime) {
		lines.push(row(['regular_hours', overtime.regularHours.toFixed(2)]));
		lines.push(row(['overtime_hours', overtime.overtimeHours.toFixed(2)]));
		if (overtime.estimatedGrossPay !== null) {
			lines.push(row(['estimated_gross_pay', overtime.estimatedGrossPay.toFixed(2)]));
		}
	}

	return `${lines.join('\n')}\n`;
}

/** Trigger a browser download for a CSV string. */
export function downloadCsv(filename: string, csv: string): void {
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}

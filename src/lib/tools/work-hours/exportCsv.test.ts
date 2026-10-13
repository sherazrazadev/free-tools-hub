import { describe, expect, it } from 'vitest';
import { calculateDayTotal } from './shifts';
import { dayTotalToCsv, weekTotalToCsv } from './exportCsv';
import { calculateWeekTotal, fixtureWeek } from './week';

describe('exportCsv', () => {
	it('includes day net total matching on-screen math', () => {
		const shifts = [
			{
				start: '09:00',
				end: '17:30',
				endsNextDay: false,
				unpaidBreakMinutes: 30,
			},
		];
		const day = calculateDayTotal(shifts);
		expect(day.ok).toBe(true);
		if (!day.ok) return;
		const csv = dayTotalToCsv(shifts, day);
		expect(csv).toContain('total_net_minutes,480');
		expect(csv).toContain('decimal_hours,8.00');
	});

	it('includes week totals for the fixture week', () => {
		const week = calculateWeekTotal(fixtureWeek());
		expect(week.ok).toBe(true);
		if (!week.ok) return;
		const csv = weekTotalToCsv(week);
		expect(csv).toContain('week_net_minutes,2400');
		expect(csv).toContain('week_decimal_hours,40.00');
		expect(csv).toContain('Monday');
	});
});

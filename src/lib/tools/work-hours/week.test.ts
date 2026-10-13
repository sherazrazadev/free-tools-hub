import { describe, expect, it } from 'vitest';
import { calculateWeekTotal, fixtureWeek } from './week';

describe('calculateWeekTotal', () => {
	it('matches the fixture week at 40 net hours', () => {
		const result = calculateWeekTotal(fixtureWeek());
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.totalNetMinutes).toBe(40 * 60);
			expect(result.hours).toBe(40);
			expect(result.minutes).toBe(0);
			expect(result.decimalHours).toBe(40);
			expect(result.totalBreakMinutes).toBe(30);
			expect(result.days.filter((d) => d.day === null)).toHaveLength(2);
		}
	});

	it('surfaces day-level validation errors', () => {
		const week = fixtureWeek();
		week[0] = {
			id: 'mon',
			shifts: [
				{
					start: '',
					end: '17:00',
					endsNextDay: false,
					unpaidBreakMinutes: 0,
				},
			],
		};
		const result = calculateWeekTotal(week);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe('day_error');
			expect(result.dayId).toBe('mon');
		}
	});
});

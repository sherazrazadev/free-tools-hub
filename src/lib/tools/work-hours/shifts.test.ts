import { describe, expect, it } from 'vitest';
import { calculateDayTotal, calculateShiftWithBreak } from './shifts';

describe('calculateShiftWithBreak', () => {
	it('deducts unpaid break from 09:00–17:30 with 30 min break → 8h net', () => {
		const result = calculateShiftWithBreak({
			start: '09:00',
			end: '17:30',
			endsNextDay: false,
			unpaidBreakMinutes: 30,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.gross.totalMinutes).toBe(510);
			expect(result.unpaidBreakMinutes).toBe(30);
			expect(result.netMinutes).toBe(480);
			expect(result.hours).toBe(8);
			expect(result.minutes).toBe(0);
			expect(result.decimalHours).toBe(8);
		}
	});

	it('allows zero break', () => {
		const result = calculateShiftWithBreak({
			start: '09:00',
			end: '17:00',
			endsNextDay: false,
			unpaidBreakMinutes: 0,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.netMinutes).toBe(480);
		}
	});

	it('rejects break longer than elapsed', () => {
		const result = calculateShiftWithBreak({
			start: '09:00',
			end: '10:00',
			endsNextDay: false,
			unpaidBreakMinutes: 90,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('break_exceeds');
	});

	it('rejects negative break', () => {
		const result = calculateShiftWithBreak({
			start: '09:00',
			end: '17:00',
			endsNextDay: false,
			unpaidBreakMinutes: -5,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('break_invalid');
	});
});

describe('calculateDayTotal', () => {
	it('sums two shifts with breaks', () => {
		const result = calculateDayTotal([
			{
				start: '09:00',
				end: '13:00',
				endsNextDay: false,
				unpaidBreakMinutes: 0,
			},
			{
				start: '14:00',
				end: '18:00',
				endsNextDay: false,
				unpaidBreakMinutes: 15,
			},
		]);
		// 4h + (4h − 15m) = 7h45
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.totalGrossMinutes).toBe(480);
			expect(result.totalBreakMinutes).toBe(15);
			expect(result.totalNetMinutes).toBe(465);
			expect(result.hours).toBe(7);
			expect(result.minutes).toBe(45);
			expect(result.decimalHours).toBe(7.75);
		}
	});

	const shift = (start: string, end: string, endsNextDay = false) => ({
		start,
		end,
		endsNextDay,
		unpaidBreakMinutes: 0,
	});

	it('rejects overlapping shifts instead of double counting', () => {
		const result = calculateDayTotal([shift('09:00', '17:30'), shift('14:00', '18:00')]);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe('overlap');
			expect(result.rowIndex).toBe(1);
			expect(result.message).toContain('Shift 1 and shift 2');
		}
	});

	it('allows back-to-back shifts that only touch', () => {
		const result = calculateDayTotal([shift('09:00', '13:00'), shift('13:00', '17:00')]);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.totalNetMinutes).toBe(480);
	});

	it('detects overlap regardless of row order', () => {
		const result = calculateDayTotal([shift('14:00', '18:00'), shift('09:00', '15:00')]);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('overlap');
	});

	it('treats an overnight shift as running past midnight', () => {
		const clash = calculateDayTotal([shift('22:00', '02:00', true), shift('23:00', '23:30')]);
		expect(clash.ok).toBe(false);
		const clear = calculateDayTotal([shift('06:00', '08:00'), shift('22:00', '02:00', true)]);
		expect(clear.ok).toBe(true);
	});

	it('errors on empty shift list', () => {
		const result = calculateDayTotal([]);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('empty');
	});

	it('surfaces incomplete row validation', () => {
		const result = calculateDayTotal([
			{
				start: '09:00',
				end: '17:00',
				endsNextDay: false,
				unpaidBreakMinutes: 0,
			},
			{
				start: '',
				end: '18:00',
				endsNextDay: false,
				unpaidBreakMinutes: 0,
			},
		]);
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe('row_error');
			expect(result.rowIndex).toBe(1);
		}
	});
});

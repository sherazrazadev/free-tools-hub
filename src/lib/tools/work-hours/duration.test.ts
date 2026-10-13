import { describe, expect, it } from 'vitest';
import { calculateDuration, parseTimeToMinutes } from './duration';

describe('parseTimeToMinutes', () => {
	it('parses HH:MM', () => {
		expect(parseTimeToMinutes('09:00')).toBe(9 * 60);
		expect(parseTimeToMinutes('17:30')).toBe(17 * 60 + 30);
	});

	it('rejects invalid values', () => {
		expect(parseTimeToMinutes('')).toBeNull();
		expect(parseTimeToMinutes('25:00')).toBeNull();
		expect(parseTimeToMinutes('12:60')).toBeNull();
		expect(parseTimeToMinutes('noon')).toBeNull();
	});
});

describe('calculateDuration', () => {
	it('computes 09:00–17:30 as 8h30 / 8.5', () => {
		const result = calculateDuration({
			start: '09:00',
			end: '17:30',
			endsNextDay: false,
		});
		expect(result).toEqual({
			ok: true,
			hours: 8,
			minutes: 30,
			decimalHours: 8.5,
			totalMinutes: 510,
		});
	});

	it('handles overnight shifts (22:00–06:00 next day)', () => {
		const result = calculateDuration({
			start: '22:00',
			end: '06:00',
			endsNextDay: true,
		});
		expect(result).toEqual({
			ok: true,
			hours: 8,
			minutes: 0,
			decimalHours: 8,
			totalMinutes: 480,
		});
	});

	it('treats equal times on the same day as zero duration', () => {
		const result = calculateDuration({
			start: '12:00',
			end: '12:00',
			endsNextDay: false,
		});
		expect(result).toEqual({
			ok: true,
			hours: 0,
			minutes: 0,
			decimalHours: 0,
			totalMinutes: 0,
		});
	});

	it('treats equal times with endsNextDay as 24 hours', () => {
		const result = calculateDuration({
			start: '12:00',
			end: '12:00',
			endsNextDay: true,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.hours).toBe(24);
			expect(result.minutes).toBe(0);
			expect(result.decimalHours).toBe(24);
		}
	});

	it('errors when end is before start without overnight', () => {
		const result = calculateDuration({
			start: '22:00',
			end: '06:00',
			endsNextDay: false,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.code).toBe('needs_overnight');
		}
	});

	it('errors on missing inputs', () => {
		expect(calculateDuration({ start: '', end: '17:00', endsNextDay: false }).ok).toBe(
			false,
		);
		expect(calculateDuration({ start: '09:00', end: '  ', endsNextDay: false }).ok).toBe(
			false,
		);
		const missing = calculateDuration({ start: '', end: '', endsNextDay: false });
		expect(missing.ok).toBe(false);
		if (!missing.ok) expect(missing.code).toBe('missing');
	});

	it('errors on invalid time strings', () => {
		const result = calculateDuration({
			start: '9am',
			end: '17:00',
			endsNextDay: false,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('invalid');
	});
});

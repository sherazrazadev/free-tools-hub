import { describe, expect, it } from 'vitest';
import { applyOvertime } from './overtime';

describe('applyOvertime', () => {
	it('splits 45h at a 40h threshold with 1.5x and pay estimate', () => {
		const result = applyOvertime(45 * 60, {
			regularThresholdHours: 40,
			overtimeMultiplier: 1.5,
			hourlyRate: 20,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.regularHours).toBe(40);
			expect(result.overtimeHours).toBe(5);
			expect(result.estimatedRegularPay).toBe(800);
			expect(result.estimatedOvertimePay).toBe(150);
			expect(result.estimatedGrossPay).toBe(950);
		}
	});

	it('treats all hours as regular when under threshold', () => {
		const result = applyOvertime(30 * 60, {
			regularThresholdHours: 40,
			overtimeMultiplier: 1.5,
			hourlyRate: null,
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.regularHours).toBe(30);
			expect(result.overtimeHours).toBe(0);
			expect(result.estimatedGrossPay).toBeNull();
		}
	});

	it('rejects invalid multiplier', () => {
		const result = applyOvertime(40 * 60, {
			regularThresholdHours: 40,
			overtimeMultiplier: 0.5,
			hourlyRate: null,
		});
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.code).toBe('multiplier_invalid');
	});
});

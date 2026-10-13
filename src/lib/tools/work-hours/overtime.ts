/**
 * Configurable overtime split + optional gross pay estimate.
 * Not jurisdiction-specific legal overtime.
 */

export type OvertimeConfig = {
	/** Hours at regular rate before overtime (e.g. 40). */
	regularThresholdHours: number;
	/** Multiplier for OT hours (e.g. 1.5). */
	overtimeMultiplier: number;
	/** Optional hourly rate for a gross pay estimate. */
	hourlyRate: number | null;
};

export type OvertimeSuccess = {
	ok: true;
	regularMinutes: number;
	overtimeMinutes: number;
	regularHours: number;
	overtimeHours: number;
	thresholdHours: number;
	overtimeMultiplier: number;
	hourlyRate: number | null;
	estimatedRegularPay: number | null;
	estimatedOvertimePay: number | null;
	estimatedGrossPay: number | null;
};

export type OvertimeError = {
	ok: false;
	code: 'threshold_invalid' | 'multiplier_invalid' | 'rate_invalid';
	message: string;
};

export type OvertimeResult = OvertimeSuccess | OvertimeError;

function hoursFromMinutes(minutes: number): number {
	return Math.round((minutes / 60) * 100) / 100;
}

function money(amount: number): number {
	return Math.round(amount * 100) / 100;
}

/**
 * Split net minutes into regular vs overtime using a user threshold,
 * optionally estimate gross pay from an hourly rate.
 */
export function applyOvertime(
	totalNetMinutes: number,
	config: OvertimeConfig,
): OvertimeResult {
	if (
		!Number.isFinite(config.regularThresholdHours) ||
		config.regularThresholdHours < 0
	) {
		return {
			ok: false,
			code: 'threshold_invalid',
			message: 'Regular-hour threshold must be zero or a positive number.',
		};
	}

	if (
		!Number.isFinite(config.overtimeMultiplier) ||
		config.overtimeMultiplier < 1
	) {
		return {
			ok: false,
			code: 'multiplier_invalid',
			message: 'Overtime multiplier must be 1 or greater (for example 1.5).',
		};
	}

	if (
		config.hourlyRate !== null &&
		(!Number.isFinite(config.hourlyRate) || config.hourlyRate < 0)
	) {
		return {
			ok: false,
			code: 'rate_invalid',
			message: 'Hourly rate must be empty or a number of 0 or more.',
		};
	}

	const thresholdMinutes = Math.round(config.regularThresholdHours * 60);
	const regularMinutes = Math.min(totalNetMinutes, thresholdMinutes);
	const overtimeMinutes = Math.max(0, totalNetMinutes - thresholdMinutes);

	const regularHours = hoursFromMinutes(regularMinutes);
	const overtimeHours = hoursFromMinutes(overtimeMinutes);

	let estimatedRegularPay: number | null = null;
	let estimatedOvertimePay: number | null = null;
	let estimatedGrossPay: number | null = null;

	if (config.hourlyRate !== null) {
		estimatedRegularPay = money(regularHours * config.hourlyRate);
		estimatedOvertimePay = money(
			overtimeHours * config.hourlyRate * config.overtimeMultiplier,
		);
		estimatedGrossPay = money(estimatedRegularPay + estimatedOvertimePay);
	}

	return {
		ok: true,
		regularMinutes,
		overtimeMinutes,
		regularHours,
		overtimeHours,
		thresholdHours: config.regularThresholdHours,
		overtimeMultiplier: config.overtimeMultiplier,
		hourlyRate: config.hourlyRate,
		estimatedRegularPay,
		estimatedOvertimePay,
		estimatedGrossPay,
	};
}

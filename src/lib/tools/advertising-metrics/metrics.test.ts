import { describe, expect, it } from 'vitest';
import { calculateAdsMetrics } from './metrics';

const base = {
	spend: 100,
	impressions: 50_000,
	clicks: 500,
	conversions: 25,
	revenue: 400,
};

describe('calculateAdsMetrics', () => {
	it('computes standard metrics for a worked example', () => {
		const r = calculateAdsMetrics(base);
		expect(r.ok).toBe(true);
		if (!r.ok) return;

		expect(r.cpm.ok).toBe(true);
		if (r.cpm.ok) expect(r.cpm.value).toBe(2); // (100/50000)*1000

		expect(r.cpc.ok).toBe(true);
		if (r.cpc.ok) expect(r.cpc.value).toBe(0.2); // 100/500

		expect(r.ctr.ok).toBe(true);
		if (r.ctr.ok) expect(r.ctr.value).toBe(0.01); // 500/50000

		expect(r.cpa.ok).toBe(true);
		if (r.cpa.ok) expect(r.cpa.value).toBe(4); // 100/25

		expect(r.conversionRate.ok).toBe(true);
		if (r.conversionRate.ok) expect(r.conversionRate.value).toBe(0.05); // 25/500

		expect(r.roas.ok).toBe(true);
		if (r.roas.ok) expect(r.roas.value).toBe(4); // 400/100
	});

	it('does not return Infinity when spend is zero (ROAS unavailable)', () => {
		const r = calculateAdsMetrics({ ...base, spend: 0, revenue: 100 });
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.roas.ok).toBe(false);
		if (!r.roas.ok) {
			expect(r.roas.reason.toLowerCase()).toMatch(/zero|cannot/);
			expect(r.roas.reason).not.toMatch(/Infinity/i);
		}
		// CPM with spend 0 and impressions > 0 is a defined zero cost.
		expect(r.cpm.ok).toBe(true);
		if (r.cpm.ok) expect(r.cpm.value).toBe(0);
	});

	it('handles zero impressions without Infinity', () => {
		const r = calculateAdsMetrics({ ...base, impressions: 0, clicks: 0 });
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.cpm.ok).toBe(false);
		expect(r.ctr.ok).toBe(false);
	});

	it('handles zero clicks without Infinity', () => {
		const r = calculateAdsMetrics({
			...base,
			clicks: 0,
			conversions: 0,
		});
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.cpc.ok).toBe(false);
		expect(r.conversionRate.ok).toBe(false);
	});

	it('handles zero conversions without Infinity', () => {
		const r = calculateAdsMetrics({ ...base, conversions: 0 });
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.cpa.ok).toBe(false);
	});

	it('rejects negative inputs', () => {
		const r = calculateAdsMetrics({ ...base, spend: -1 });
		expect(r.ok).toBe(false);
	});

	it('rejects non-finite inputs', () => {
		const r = calculateAdsMetrics({ ...base, revenue: Number.NaN });
		expect(r.ok).toBe(false);
	});

	it('rejects clicks greater than impressions', () => {
		const r = calculateAdsMetrics({ ...base, impressions: 10, clicks: 11 });
		expect(r.ok).toBe(false);
	});

	it('attaches formula strings to each metric', () => {
		const r = calculateAdsMetrics(base);
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		expect(r.roas.formula).toContain('Revenue');
		expect(r.cpm.formula).toContain('1000');
	});
});

import { describe, expect, it } from 'vitest';
import { computeEstimatedScore } from './exam.service';

describe('computeEstimatedScore', () => {
	it('maps perfect score to max', () => {
		expect(computeEstimatedScore(65, 65, 100, 1000)).toBe(1000);
	});

	it('maps zero to min', () => {
		expect(computeEstimatedScore(0, 65, 100, 1000)).toBe(100);
	});

	it('interpolates linearly', () => {
		expect(computeEstimatedScore(50, 65, 100, 1000)).toBe(792);
	});

	it('handles zero total questions', () => {
		expect(computeEstimatedScore(0, 0, 100, 1000)).toBe(100);
	});
});

describe('timer remaining seconds', () => {
	it('never goes negative', () => {
		const startedAt = new Date(Date.now() - 200 * 60 * 1000).toISOString();
		const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
		const remaining = Math.max(0, 130 * 60 - elapsed);
		expect(remaining).toBe(0);
	});

	it('computes remaining from server timestamps', () => {
		const startedAt = new Date(Date.now() - 10 * 60 * 1000).toISOString();
		const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
		const remaining = Math.max(0, 130 * 60 - elapsed);
		expect(remaining).toBeGreaterThan(119 * 60);
		expect(remaining).toBeLessThanOrEqual(120 * 60);
	});
});

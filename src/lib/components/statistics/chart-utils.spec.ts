import { describe, expect, it } from 'vitest';
import { accuracyBarColor, toBarItems, topByAccuracy, pct, shortDate } from './chart-utils';

describe('accuracyBarColor', () => {
	it('returns teal at or above 0.8', () => {
		expect(accuracyBarColor(0.8)).toBe('teal');
		expect(accuracyBarColor(0.95)).toBe('teal');
	});

	it('returns yellow between 0.6 and 0.8', () => {
		expect(accuracyBarColor(0.79)).toBe('yellow');
		expect(accuracyBarColor(0.6)).toBe('yellow');
	});

	it('returns red below 0.6', () => {
		expect(accuracyBarColor(0.59)).toBe('red');
		expect(accuracyBarColor(0)).toBe('red');
	});
});

describe('toBarItems', () => {
	it('marks zero-attempt items as gray', () => {
		const items = toBarItems(
			[
				{ value: 0, attempts: 0 },
				{ value: 0.9, attempts: 3 }
			],
			(item, index) => `Domain ${index + 1}`
		);
		expect(items[0].color).toBe('gray');
		expect(items[1].color).toBe('teal');
	});

	it('applies threshold color for attempted items', () => {
		const items = toBarItems([{ value: 0.5, attempts: 4 }], () => 'X');
		expect(items[0].color).toBe('red');
	});
});

describe('topByAccuracy', () => {
	const services = [
		{ serviceName: 'S3', accuracy: 0.3, attempted: 10 },
		{ serviceName: 'VPC', accuracy: 0.9, attempted: 5 },
		{ serviceName: 'EC2', accuracy: 0.7, attempted: 0 },
		{ serviceName: 'IAM', accuracy: 0.6, attempted: 8 }
	];

	it('filters out zero-attempt services and sorts by accuracy', () => {
		const result = topByAccuracy(services, 'serviceName', 2);
		expect(result.map((r) => r.label)).toEqual(['VPC', 'IAM']);
	});

	it('respects the limit', () => {
		expect(topByAccuracy(services, 'serviceName', 1)).toHaveLength(1);
	});
});

describe('format helpers', () => {
	it('formats percentages', () => {
		expect(pct(0.812)).toBe('81%');
		expect(pct(0)).toBe('0%');
	});

	it('formats short dates', () => {
		expect(shortDate('2026-03-14T08:00:00Z')).toBe('14 Mar');
	});
});

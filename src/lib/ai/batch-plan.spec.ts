import { describe, expect, it } from 'vitest';
import {
	buildPlan,
	chunk,
	initProgress,
	applyBatch,
	markSkipped,
	DEFAULT_BATCH_SIZE,
	MAX_CONSECUTIVE_FAILURES
} from './batch-plan';

describe('buildPlan', () => {
	const options = {
		domains: ['resilient_architecture', 'secure_architecture'],
		difficulty: ['medium', 'hard', 'easy'],
		questionTypes: ['single', 'multiple'],
		services: ['Amazon S3', 'Amazon EC2']
	};

	it('round-robins domain, difficulty, and type across the plan', () => {
		const plan = buildPlan(6, options);
		expect(plan).toHaveLength(6);
		expect(plan[0]).toEqual({
			domain: 'resilient_architecture',
			difficulty: 'medium',
			questionType: 'single',
			services: ['Amazon S3']
		});
		expect(plan[1].domain).toBe('secure_architecture');
		expect(plan[1].difficulty).toBe('hard');
		expect(plan[1].questionType).toBe('multiple');
		expect(plan[2].domain).toBe('resilient_architecture');
	});

	it('returns an empty plan for zero or no domains', () => {
		expect(buildPlan(0, options)).toEqual([]);
		expect(buildPlan(5, { ...options, domains: [] })).toEqual([]);
	});

	it('omits services when none are selected', () => {
		const plan = buildPlan(2, { ...options, services: undefined });
		expect(plan.every((p) => p.services.length === 0)).toBe(true);
	});
});

describe('chunk', () => {
	it('splits into fixed-size batches', () => {
		expect(chunk([1, 2, 3, 4, 5, 6], 5)).toEqual([[1, 2, 3, 4, 5], [6]]);
	});
});

describe('progress helpers', () => {
	it('initializes with the correct batch count', () => {
		expect(initProgress(20).batchesTotal).toBe(4);
		expect(initProgress(20).total).toBe(20);
		expect(initProgress(5).batchesTotal).toBe(1);
	});

	it('accumulates outcomes across batches', () => {
		let progress = initProgress(10);
		progress = applyBatch(progress, { attempted: 5, saved: 4, needReview: 1, failed: 0 });
		progress = applyBatch(progress, { attempted: 5, saved: 0, needReview: 0, failed: 5 });
		expect(progress.batchesDone).toBe(2);
		expect(progress.done).toBe(10);
		expect(progress.saved).toBe(4);
		expect(progress.needReview).toBe(1);
		expect(progress.failed).toBe(5);
	});

	it('marks the remainder as skipped', () => {
		let progress = initProgress(20);
		progress = applyBatch(progress, { attempted: 5, saved: 5, needReview: 0, failed: 0 });
		progress = markSkipped(progress);
		expect(progress.skipped).toBe(15);
	});

	it('exposes the configured limits', () => {
		expect(DEFAULT_BATCH_SIZE).toBe(5);
		expect(MAX_CONSECUTIVE_FAILURES).toBe(3);
	});
});

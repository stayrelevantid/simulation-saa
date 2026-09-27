export const DEFAULT_BATCH_SIZE = 5;
export const MAX_CONSECUTIVE_FAILURES = 3;
export const BATCH_TIMEOUT_MS = 120_000;

export interface PlanItem {
	domain: string;
	difficulty: string;
	questionType: string;
	services: string[];
}

export interface PlanOptions {
	domains: string[];
	difficulty: string[];
	questionTypes: string[];
	services?: string[];
}

export function buildPlan(total: number, options: PlanOptions): PlanItem[] {
	if (total <= 0 || options.domains.length === 0) return [];

	const diffs = options.difficulty.length > 0 ? options.difficulty : ['medium'];
	const types = options.questionTypes.length > 0 ? options.questionTypes : ['single'];
	const services = options.services ?? [];

	const items: PlanItem[] = [];
	for (let i = 0; i < total; i++) {
		items.push({
			domain: options.domains[i % options.domains.length],
			difficulty: diffs[i % diffs.length],
			questionType: types[i % types.length],
			services: services.length > 0 ? [services[i % services.length]] : []
		});
	}
	return items;
}

export function chunk<T>(items: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		out.push(items.slice(i, i + size));
	}
	return out;
}

export interface JobProgress {
	batchesTotal: number;
	batchesDone: number;
	done: number;
	total: number;
	saved: number;
	needReview: number;
	failed: number;
	skipped: number;
	updatedAt: string;
}

export function initProgress(total: number, batchSize = DEFAULT_BATCH_SIZE): JobProgress {
	return {
		batchesTotal: Math.max(1, Math.ceil(total / batchSize)),
		batchesDone: 0,
		done: 0,
		total,
		saved: 0,
		needReview: 0,
		failed: 0,
		skipped: 0,
		updatedAt: new Date().toISOString()
	};
}

export interface BatchOutcome {
	attempted: number;
	saved: number;
	needReview: number;
	failed: number;
}

export function applyBatch(progress: JobProgress, outcome: BatchOutcome): JobProgress {
	return {
		...progress,
		batchesDone: progress.batchesDone + 1,
		done: progress.done + outcome.attempted,
		saved: progress.saved + outcome.saved,
		needReview: progress.needReview + outcome.needReview,
		failed: progress.failed + outcome.failed,
		updatedAt: new Date().toISOString()
	};
}

export function markSkipped(progress: JobProgress): JobProgress {
	return {
		...progress,
		skipped: progress.total - progress.done,
		updatedAt: new Date().toISOString()
	};
}

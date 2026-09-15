import { describe, expect, it, vi } from 'vitest';
import { GENERATION_TIMEOUT_MS, STALE_JOB_MS, rejectAfter, isStaleRunning } from './job-runtime';

describe('rejectAfter', () => {
	it('rejects after the given time', async () => {
		const error = await rejectAfter(5, 'timed out').catch((e) => e);
		expect(String(error)).toBe('Error: timed out');
	});

	it('never resolves', async () => {
		const watcher = vi.fn();
		rejectAfter(5, 'x').then(watcher);
		await new Promise((r) => setTimeout(r, 20));
		expect(watcher).not.toHaveBeenCalled();
	});

	it('uses the exported generation timeout threshold', () => {
		expect(GENERATION_TIMEOUT_MS).toBe(5 * 60 * 1000);
	});
});

describe('isStaleRunning', () => {
	it('flags an old running job as stale', () => {
		const createdAt = new Date(Date.now() - STALE_JOB_MS - 1000).toISOString();
		expect(isStaleRunning('running', createdAt)).toBe(true);
	});

	it('keeps a recent running job as live', () => {
		const createdAt = new Date(Date.now() - 1000).toISOString();
		expect(isStaleRunning('running', createdAt)).toBe(false);
	});

	it('never flags completed or failed jobs', () => {
		const createdAt = new Date(Date.now() - STALE_JOB_MS - 5000).toISOString();
		expect(isStaleRunning('completed', createdAt)).toBe(false);
		expect(isStaleRunning('failed', createdAt)).toBe(false);
	});

	it('accepts an explicit reference time', () => {
		const createdAt = '2026-09-01T00:00:00Z';
		expect(isStaleRunning('running', createdAt, new Date('2026-09-01T00:00:01Z').getTime())).toBe(
			false
		);
		expect(isStaleRunning('running', createdAt, new Date('2026-09-10T00:00:00Z').getTime())).toBe(
			true
		);
	});
});

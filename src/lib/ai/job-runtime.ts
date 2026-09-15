export const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;
export const STALE_JOB_MS = 6 * 60 * 1000;

export const GENERATION_TIMEOUT_MESSAGE =
	'Generation timed out — the provider did not respond. Please try again.';

export function rejectAfter<T>(ms: number, message: string): Promise<T> {
	return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

export function isStaleRunning(
	status: string,
	createdAt: string,
	now: number = Date.now()
): boolean {
	return status === 'running' && now - new Date(createdAt).getTime() > STALE_JOB_MS;
}

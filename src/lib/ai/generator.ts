import { db } from '$lib/db/client';
import { aiGenerations } from '$lib/db/schema';
import { getProviderFromEnv, getOpenCodeBaseUrl } from '$lib/ai/provider-env';
import { validateGeneratedQuestions } from '$lib/ai/validator';
import { importGeneratedQuestions } from '$lib/ai/import-questions';
import type { GenerationRequestConfig } from '$lib/ai/provider';
import { eq, sql } from 'drizzle-orm';
import { GENERATION_TIMEOUT_MESSAGE, rejectAfter, isStaleRunning } from '$lib/ai/job-runtime';
import {
	buildPlan,
	chunk,
	initProgress,
	applyBatch,
	markSkipped,
	DEFAULT_BATCH_SIZE,
	MAX_CONSECUTIVE_FAILURES,
	BATCH_TIMEOUT_MS,
	type JobProgress
} from '$lib/ai/batch-plan';

const now = () => new Date().toISOString();

export async function startGenerationJob(
	config: GenerationRequestConfig,
	model: string
): Promise<number> {
	const [generation] = await db
		.insert(aiGenerations)
		.values({
			model,
			baseUrl: getOpenCodeBaseUrl(),
			examProfileId: 1,
			questionCount: config.questionCount,
			configuration: JSON.stringify(config),
			status: 'running',
			progress: JSON.stringify(initProgress(config.questionCount)),
			createdAt: now()
		})
		.returning();
	return generation.id;
}

export interface GenerationJobResult {
	generatedCount: number;
	validCount: number;
	needReviewCount: number;
	importedCount: number;
	skippedCount: number;
	failedCount: number;
	importedIds: number[];
	preview?: unknown[];
	issues?: { questionIndex: number; message: string }[];
	failures?: string[];
	error?: string;
	rawPreview?: string;
}

function emptyResult(message?: string): GenerationJobResult {
	return {
		generatedCount: 0,
		validCount: 0,
		needReviewCount: 0,
		importedCount: 0,
		skippedCount: 0,
		failedCount: 0,
		importedIds: [],
		error: message
	};
}

async function saveProgress(jobId: number, progress: JobProgress): Promise<void> {
	await db
		.update(aiGenerations)
		.set({ progress: JSON.stringify(progress) })
		.where(eq(aiGenerations.id, jobId));
}

export async function runGenerationJob(jobId: number): Promise<void> {
	const [job] = await db.select().from(aiGenerations).where(eq(aiGenerations.id, jobId));
	if (!job || job.status !== 'running') return;

	const config = JSON.parse(job.configuration ?? '{}') as GenerationRequestConfig;

	const plan = buildPlan(config.questionCount, {
		domains: config.domains ?? [],
		difficulty: config.difficulty ?? [],
		questionTypes: config.questionTypes ?? [],
		services: config.awsServices
	});

	const batches = chunk(plan, DEFAULT_BATCH_SIZE);
	let progress = initProgress(config.questionCount);
	await saveProgress(jobId, progress);

	const preview: unknown[] = [];
	const issues: GenerationJobResult['issues'] = [];
	const importedIds: number[] = [];
	const failures: string[] = [];
	let consecutiveFailures = 0;

	const provider = getProviderFromEnv();

	for (const batch of batches) {
		if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
			progress = markSkipped(progress);
			await saveProgress(jobId, progress);
			break;
		}

		const batchConfig: GenerationRequestConfig = {
			examProfile: config.examProfile,
			questionCount: batch.length,
			difficulty: [
				...new Set(batch.map((b) => b.difficulty))
			] as GenerationRequestConfig['difficulty'],
			questionTypes: [
				...new Set(batch.map((b) => b.questionType))
			] as GenerationRequestConfig['questionTypes'],
			domains: [...new Set(batch.map((b) => b.domain))],
			awsServices: config.awsServices,
			scenarioStyle: config.scenarioStyle
		};

		try {
			const generated = (await Promise.race([
				provider.generateQuestions(batchConfig, job.model),
				rejectAfter<Awaited<ReturnType<typeof provider.generateQuestions>>>(
					BATCH_TIMEOUT_MS,
					'Generation timed out — the provider did not respond. Please try again.'
				)
			])) as Awaited<ReturnType<typeof provider.generateQuestions>>;
			const { questions } = generated;

			const base = preview.length;
			const { valid, allIssues } = await validateGeneratedQuestions(questions);
			const imported = await importGeneratedQuestions(valid);

			for (const issue of allIssues) {
				issues.push({ questionIndex: base + issue.questionIndex, message: issue.message });
			}
			preview.push(...questions);
			importedIds.push(...imported.importedIds);

			progress = applyBatch(progress, {
				attempted: batch.length,
				saved: imported.importedCount,
				needReview: allIssues.length,
				failed: Math.max(0, batch.length - questions.length)
			});
			consecutiveFailures = 0;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'AI generation failed';
			failures.push(message);
			consecutiveFailures += 1;
			progress = applyBatch(progress, {
				attempted: batch.length,
				saved: 0,
				needReview: 0,
				failed: batch.length
			});
		}

		await saveProgress(jobId, progress);
	}

	const reviewedCount = new Set(issues.map((issue) => issue.questionIndex)).size;
	const result: GenerationJobResult = {
		generatedCount: preview.length,
		validCount: preview.length - reviewedCount,
		needReviewCount: reviewedCount,
		importedCount: progress.saved,
		skippedCount: progress.skipped,
		failedCount: progress.failed,
		importedIds,
		preview,
		issues,
		failures,
		error: failures[0]
	};

	const status = progress.saved > 0 ? 'completed' : 'failed';

	await db
		.update(aiGenerations)
		.set({ status, result: JSON.stringify(result), progress: JSON.stringify(progress) })
		.where(eq(aiGenerations.id, jobId));
}

function progressReference(job: {
	status: string;
	createdAt: string;
	progress?: string | null;
}): string {
	if (job.progress) {
		try {
			const parsed = JSON.parse(job.progress) as { updatedAt?: string };
			if (parsed.updatedAt) return parsed.updatedAt;
		} catch {
			// fall through to createdAt
		}
	}
	return job.createdAt;
}

export async function expireStaleRunning(job: {
	id: number;
	status: string;
	createdAt: string;
	progress?: string | null;
}): Promise<GenerationJobResult | null> {
	if (job.status !== 'running') return null;
	if (!isStaleRunning(job.status, progressReference(job))) return null;

	const result = emptyResult(GENERATION_TIMEOUT_MESSAGE);
	await db
		.update(aiGenerations)
		.set({ status: 'failed', result: JSON.stringify(result) })
		.where(eq(aiGenerations.id, job.id));
	return result;
}

export async function getJobStatus(jobId: number) {
	const [job] = await db.select().from(aiGenerations).where(eq(aiGenerations.id, jobId));
	if (!job) return null;

	const expired = await expireStaleRunning(job);
	const status = expired ? 'failed' : job.status;
	const result = expired ? expired : job.result ? JSON.parse(job.result) : null;
	const progress = job.progress ? safeParse(job.progress) : null;

	return { id: job.id, status, createdAt: job.createdAt, result, progress };
}

function safeParse(value: string): unknown {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

export async function listGenerationHistory(limit = 10) {
	const rows = await db
		.select()
		.from(aiGenerations)
		.orderBy(sql`created_at DESC`)
		.limit(limit);

	const out = [];
	for (const row of rows) {
		const expired = await expireStaleRunning(row);
		out.push({ ...row, status: expired ? 'failed' : row.status });
	}
	return out;
}

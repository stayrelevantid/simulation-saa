import { db } from '$lib/db/client';
import { aiGenerations } from '$lib/db/schema';
import { getProviderFromEnv, getOpenCodeBaseUrl } from '$lib/ai/provider-env';
import { validateGeneratedQuestions } from '$lib/ai/validator';
import { importGeneratedQuestions } from '$lib/ai/import-questions';
import { AIParseError } from '$lib/ai/parser';
import type { GenerationRequestConfig } from '$lib/ai/provider';
import { eq, sql } from 'drizzle-orm';

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
	importedIds: number[];
	preview?: unknown[];
	issues?: { questionIndex: number; message: string }[];
	error?: string;
	rawPreview?: string;
}

export async function runGenerationJob(jobId: number): Promise<void> {
	const [job] = await db.select().from(aiGenerations).where(eq(aiGenerations.id, jobId));

	if (!job || job.status !== 'running') return;

	const config = JSON.parse(job.configuration ?? '{}') as GenerationRequestConfig;

	try {
		const provider = getProviderFromEnv();
		const { questions } = await provider.generateQuestions(config, job.model);

		const { valid, allIssues } = await validateGeneratedQuestions(questions);
		const imported = await importGeneratedQuestions(valid);

		const result: GenerationJobResult = {
			generatedCount: questions.length,
			validCount: valid.length,
			needReviewCount: questions.length - valid.length,
			importedCount: imported.importedCount,
			skippedCount: imported.skippedCount,
			importedIds: imported.importedIds,
			preview: questions,
			issues: allIssues
		};

		await db
			.update(aiGenerations)
			.set({ status: 'completed', result: JSON.stringify(result) })
			.where(eq(aiGenerations.id, jobId));
	} catch (err) {
		const message = err instanceof Error ? err.message : 'AI generation failed';
		const result: GenerationJobResult = {
			generatedCount: 0,
			validCount: 0,
			needReviewCount: 0,
			importedCount: 0,
			skippedCount: 0,
			importedIds: [],
			error: message,
			rawPreview: err instanceof AIParseError ? err.rawPreview : undefined
		};
		await db
			.update(aiGenerations)
			.set({ status: 'failed', result: JSON.stringify(result) })
			.where(eq(aiGenerations.id, jobId));
	}
}

const JOB_TIMEOUT_MS = 6 * 60 * 1000;

export async function getJobStatus(jobId: number) {
	const [job] = await db.select().from(aiGenerations).where(eq(aiGenerations.id, jobId));
	if (!job) return null;

	// Guard against orphaned 'running' jobs (e.g. process restarted mid-generation)
	if (job.status === 'running' && Date.now() - new Date(job.createdAt).getTime() > JOB_TIMEOUT_MS) {
		const result: GenerationJobResult = {
			generatedCount: 0,
			validCount: 0,
			needReviewCount: 0,
			importedCount: 0,
			skippedCount: 0,
			importedIds: [],
			error: 'Generation timed out. Please try again.'
		};
		await db
			.update(aiGenerations)
			.set({ status: 'failed', result: JSON.stringify(result) })
			.where(eq(aiGenerations.id, jobId));
		job.status = 'failed';
		job.result = JSON.stringify(result);
	}

	return {
		id: job.id,
		status: job.status,
		createdAt: job.createdAt,
		result: job.result ? (JSON.parse(job.result) as GenerationJobResult) : null
	};
}

export async function listGenerationHistory(limit = 10) {
	return db
		.select()
		.from(aiGenerations)
		.orderBy(sql`created_at DESC`)
		.limit(limit);
}

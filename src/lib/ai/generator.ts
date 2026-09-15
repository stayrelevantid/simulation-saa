import { db } from '$lib/db/client';
import { aiGenerations } from '$lib/db/schema';
import { getProviderFromEnv, getOpenCodeBaseUrl } from '$lib/ai/provider-env';
import { validateGeneratedQuestions } from '$lib/ai/validator';
import { importGeneratedQuestions } from '$lib/ai/import-questions';
import { AIParseError } from '$lib/ai/parser';
import type { GenerationRequestConfig } from '$lib/ai/provider';
import { eq, sql } from 'drizzle-orm';
import {
	GENERATION_TIMEOUT_MS,
	GENERATION_TIMEOUT_MESSAGE,
	rejectAfter,
	isStaleRunning
} from '$lib/ai/job-runtime';

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

function timeoutResult(message: string): GenerationJobResult {
	return {
		generatedCount: 0,
		validCount: 0,
		needReviewCount: 0,
		importedCount: 0,
		skippedCount: 0,
		importedIds: [],
		error: message
	};
}

export async function runGenerationJob(jobId: number): Promise<void> {
	const [job] = await db.select().from(aiGenerations).where(eq(aiGenerations.id, jobId));

	if (!job || job.status !== 'running') return;

	const config = JSON.parse(job.configuration ?? '{}') as GenerationRequestConfig;

	try {
		const provider = getProviderFromEnv();
		const generated = (await Promise.race([
			provider.generateQuestions(config, job.model),
			rejectAfter<Awaited<ReturnType<typeof provider.generateQuestions>>>(
				GENERATION_TIMEOUT_MS,
				'Generation timed out — the provider did not respond. Please try again.'
			)
		])) as Awaited<ReturnType<typeof provider.generateQuestions>>;
		const { questions } = generated;

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

export async function expireStaleRunning(job: {
	id: number;
	status: string;
	createdAt: string;
}): Promise<GenerationJobResult | null> {
	if (job.status !== 'running') return null;
	if (!isStaleRunning(job.status, job.createdAt)) return null;

	const result = timeoutResult(GENERATION_TIMEOUT_MESSAGE);
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

	return { id: job.id, status, createdAt: job.createdAt, result };
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

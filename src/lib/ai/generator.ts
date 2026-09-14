import { db } from '$lib/db/client';
import { aiGenerations } from '$lib/db/schema';
import { getProviderFromEnv, getOpenCodeBaseUrl } from '$lib/ai/provider-env';
import type { GenerationRequestConfig } from '$lib/ai/provider';
import { eq, sql } from 'drizzle-orm';

export async function generateQuestions(config: GenerationRequestConfig, model: string) {
	const provider = getProviderFromEnv();
	const baseUrl = getOpenCodeBaseUrl();

	const [generation] = await db
		.insert(aiGenerations)
		.values({
			model,
			baseUrl,
			examProfileId: 1,
			questionCount: config.questionCount,
			configuration: JSON.stringify(config),
			status: 'running',
			createdAt: new Date().toISOString()
		})
		.returning();

	try {
		const result = await provider.generateQuestions(config, model);
		await db
			.update(aiGenerations)
			.set({ status: 'completed' })
			.where(eq(aiGenerations.id, generation.id));
		return result;
	} catch (err) {
		await db
			.update(aiGenerations)
			.set({ status: 'failed' })
			.where(eq(aiGenerations.id, generation.id));
		throw err;
	}
}

export async function listGenerationHistory(limit = 20) {
	return db
		.select()
		.from(aiGenerations)
		.orderBy(sql`created_at DESC`)
		.limit(limit);
}

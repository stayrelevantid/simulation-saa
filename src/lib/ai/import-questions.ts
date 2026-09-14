import { db } from '$lib/db/client';
import { questions, questionOptions, questionServices } from '$lib/db/schema';
import { getDomainIdBySlug } from '$lib/ai/validator';
import { normalizeQuestionText } from '$lib/db/validation';
import type { GeneratedQuestion } from '$lib/ai/provider';

const now = () => new Date().toISOString();

/**
 * Imports generated questions into the bank (source='ai').
 * Re-checks duplicates at import time as defense in depth.
 */
export async function importGeneratedQuestions(
	candidates: GeneratedQuestion[]
): Promise<{ importedCount: number; skippedCount: number; importedIds: number[] }> {
	if (candidates.length === 0) {
		return { importedCount: 0, skippedCount: 0, importedIds: [] };
	}

	const existingTexts = await db.select({ questionText: questions.questionText }).from(questions);
	const existingSet = new Set(existingTexts.map((row) => normalizeQuestionText(row.questionText)));

	const imported: number[] = [];

	for (const candidate of candidates) {
		const normalized = normalizeQuestionText(candidate.question);
		if (existingSet.has(normalized)) continue;

		const domainId = await getDomainIdBySlug(candidate.domain);
		if (!domainId) continue;

		const insertedId = db.transaction((tx) => {
			const inserted = tx
				.insert(questions)
				.values({
					examProfileId: 1,
					questionText: candidate.question,
					questionType: candidate.type,
					difficulty: candidate.difficulty,
					domainId,
					subcategory: candidate.subcategory ?? null,
					explanation: candidate.explanation,
					keyConcept: candidate.keyConcept ?? null,
					reference: candidate.reference ?? null,
					source: 'ai',
					createdAt: now(),
					updatedAt: now()
				})
				.returning()
				.get();

			tx.insert(questionOptions)
				.values(
					candidate.options.map((o) => ({
						questionId: inserted.id,
						optionKey: o.key,
						optionText: o.text,
						isCorrect: o.correct,
						explanation: o.explanation
					}))
				)
				.run();

			if (candidate.services.length > 0) {
				tx.insert(questionServices)
					.values(
						candidate.services.map((s) => ({
							questionId: inserted.id,
							serviceName: s
						}))
					)
					.run();
			}

			return inserted.id;
		});

		existingSet.add(normalized);
		imported.push(insertedId);
	}

	return {
		importedCount: imported.length,
		skippedCount: candidates.length - imported.length,
		importedIds: imported
	};
}

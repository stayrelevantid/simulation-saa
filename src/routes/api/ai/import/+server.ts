import type { RequestHandler } from './$types';
import { db } from '$lib/db/client';
import { questions, questionOptions, questionServices } from '$lib/db/schema';
import { getDomainIdBySlug, loadExistingQuestionTexts } from '$lib/ai/validator';
import { normalizeQuestionText } from '$lib/db/validation';
import { json } from '@sveltejs/kit';
import type { GeneratedQuestion } from '$lib/ai/provider';

const now = () => new Date().toISOString();

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { questions: candidates } = body as { questions?: GeneratedQuestion[] };

	if (!Array.isArray(candidates) || candidates.length === 0) {
		return json({ error: 'No questions to import' }, { status: 400 });
	}

	// Re-check duplicates at import time (defense in depth — §35)
	const existingTexts = await loadExistingQuestionTexts();
	const imported: number[] = [];
	const skipped: number[] = [];

	for (const candidate of candidates) {
		const normalized = normalizeQuestionText(candidate.question);
		if (existingTexts.has(normalized)) {
			skipped.push(0);
			continue;
		}

		const domainId = await getDomainIdBySlug(candidate.domain);
		if (!domainId) {
			skipped.push(0);
			continue;
		}

		const insertedId = await db.transaction((tx) => {
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

		existingTexts.add(normalized);
		imported.push(insertedId);
	}

	return json({
		importedCount: imported.length,
		skippedCount: skipped.length,
		importedIds: imported
	});
};

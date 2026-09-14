import type { RequestHandler } from './$types';
import { db } from '$lib/db/client';
import { examAnswers, questionOptions, questions } from '$lib/db/schema';
import { checkAnswer } from '$lib/services/scoring.service';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { QuestionType } from '$lib/types/question';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sessionId, questionId, selected } = body as {
		sessionId: number;
		questionId: number;
		selected: string[];
	};

	if (
		typeof sessionId !== 'number' ||
		typeof questionId !== 'number' ||
		!Array.isArray(selected) ||
		selected.length === 0
	) {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const options = await db
		.select({
			optionKey: questionOptions.optionKey,
			isCorrect: questionOptions.isCorrect
		})
		.from(questionOptions)
		.where(eq(questionOptions.questionId, questionId));

	if (options.length === 0) {
		return json({ error: 'Question not found' }, { status: 404 });
	}

	const [questionRow] = await db
		.select({ questionType: questions.questionType })
		.from(questions)
		.where(eq(questions.id, questionId));

	if (!questionRow) {
		return json({ error: 'Question not found' }, { status: 404 });
	}

	const correctKeys = options.filter((o) => o.isCorrect).map((o) => o.optionKey);
	const result = checkAnswer(
		questionId,
		questionRow.questionType as QuestionType,
		selected,
		correctKeys
	);

	await db.insert(examAnswers).values({
		examSessionId: sessionId,
		questionId,
		selectedAnswers: JSON.stringify(selected),
		isCorrect: result.correct,
		answeredAt: new Date().toISOString()
	});

	return json({
		correct: result.correct,
		correctKeys: result.correctKeys
	});
};

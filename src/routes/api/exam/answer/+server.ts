import type { RequestHandler } from './$types';
import { db } from '$lib/db/client';
import { examAnswers, questionOptions, questions } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { checkAnswer } from '$lib/services/scoring.service';
import { saveExamAnswer } from '$lib/services/exam.service';
import { json } from '@sveltejs/kit';
import type { QuestionType } from '$lib/types/question';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sessionId, questionId, selected, flag } = body as {
		sessionId: number;
		questionId: number;
		selected?: string[];
		flag?: boolean;
	};

	if (typeof sessionId !== 'number' || typeof questionId !== 'number') {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const existing = await db
		.select()
		.from(examAnswers)
		.where(and(eq(examAnswers.examSessionId, sessionId), eq(examAnswers.questionId, questionId)));

	if (existing.length === 0) {
		return json({ error: 'Question not part of this exam session' }, { status: 404 });
	}

	const currentSelected = JSON.parse(existing[0].selectedAnswers) as string[];
	const newSelected = Array.isArray(selected) ? selected : currentSelected;
	const newFlag = typeof flag === 'boolean' ? flag : existing[0].flagged;

	let isCorrect: boolean | null = null;
	if (newSelected.length > 0) {
		const [questionRow] = await db
			.select({ questionType: questions.questionType })
			.from(questions)
			.where(eq(questions.id, questionId));

		const options = await db
			.select({ optionKey: questionOptions.optionKey, isCorrect: questionOptions.isCorrect })
			.from(questionOptions)
			.where(eq(questionOptions.questionId, questionId));

		const correctKeys = options.filter((o) => o.isCorrect).map((o) => o.optionKey);
		isCorrect = checkAnswer(
			questionId,
			(questionRow?.questionType as QuestionType) ?? 'single',
			newSelected,
			correctKeys
		).correct;
	}

	await saveExamAnswer(sessionId, questionId, newSelected, newFlag, isCorrect);

	return json({ saved: true, selected: newSelected, flagged: newFlag });
};

import type { RequestHandler } from './$types';
import { db } from '$lib/db/client';
import { examAnswers, questionOptions, questions, examDomains } from '$lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { getActiveExamSession } from '$lib/services/exam.service';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const session = await getActiveExamSession('SAA-C03');
	if (!session) {
		return json({ error: 'No active exam session' }, { status: 404 });
	}

	const answerRows = await db
		.select({
			questionId: examAnswers.questionId,
			selectedAnswers: examAnswers.selectedAnswers,
			flagged: examAnswers.flagged
		})
		.from(examAnswers)
		.where(eq(examAnswers.examSessionId, session.id))
		.orderBy(asc(examAnswers.id));

	const questionIds = answerRows.map((a) => a.questionId);
	if (questionIds.length === 0) {
		return json({ questions: [], answers: {} });
	}

	const questionRows = await db
		.select({
			id: questions.id,
			questionText: questions.questionText,
			questionType: questions.questionType,
			domainName: examDomains.name
		})
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.where(inArray(questions.id, questionIds));

	const optionRows = await db
		.select({
			questionId: questionOptions.questionId,
			optionKey: questionOptions.optionKey,
			optionText: questionOptions.optionText
		})
		.from(questionOptions)
		.where(inArray(questionOptions.questionId, questionIds))
		.orderBy(asc(questionOptions.optionKey));

	const optionsByQuestion = new Map<number, { optionKey: string; optionText: string }[]>();
	for (const o of optionRows) {
		const list = optionsByQuestion.get(o.questionId) ?? [];
		list.push({ optionKey: o.optionKey, optionText: o.optionText });
		optionsByQuestion.set(o.questionId, list);
	}

	const questionsById = new Map(questionRows.map((q) => [q.id, q]));
	const orderedQuestions = questionIds
		.map((id) => questionsById.get(id))
		.filter((q): q is (typeof questionRows)[number] => q !== undefined)
		.map((q) => ({ ...q, options: optionsByQuestion.get(q.id) ?? [] }));

	const answers: Record<number, { selected: string[]; flagged: boolean }> = {};
	for (const row of answerRows) {
		answers[row.questionId] = {
			selected: JSON.parse(row.selectedAnswers) as string[],
			flagged: row.flagged
		};
	}

	return json({ questions: orderedQuestions, answers });
};

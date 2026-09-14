import { db } from '$lib/db/client';
import {
	examAnswers,
	examSessions,
	questions,
	questionOptions,
	questionServices,
	examDomains,
	examProfiles
} from '$lib/db/schema';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';

export type ReviewFilter = 'all' | 'correct' | 'incorrect' | 'flagged';

export interface ReviewQuestion {
	questionId: number;
	questionNumber: number;
	questionText: string;
	questionType: string;
	difficulty: string;
	domainName: string;
	subcategory: string | null;
	explanation: string;
	keyConcept: string | null;
	reference: string | null;
	selected: string[];
	correctKeys: string[];
	isCorrect: boolean;
	flagged: boolean;
	options: {
		optionKey: string;
		optionText: string;
		isCorrect: boolean;
		explanation: string | null;
	}[];
	services: string[];
}

export async function getSessionReview(sessionId: number): Promise<ReviewQuestion[]> {
	const answerRows = await db
		.select({
			questionId: examAnswers.questionId,
			selectedAnswers: examAnswers.selectedAnswers,
			isCorrect: examAnswers.isCorrect,
			flagged: examAnswers.flagged
		})
		.from(examAnswers)
		.where(eq(examAnswers.examSessionId, sessionId))
		.orderBy(asc(examAnswers.id));

	if (answerRows.length === 0) return [];

	const questionIds = answerRows.map((a) => a.questionId);

	const questionRows = await db
		.select({
			id: questions.id,
			questionText: questions.questionText,
			questionType: questions.questionType,
			difficulty: questions.difficulty,
			domainName: examDomains.name,
			subcategory: questions.subcategory,
			explanation: questions.explanation,
			keyConcept: questions.keyConcept,
			reference: questions.reference
		})
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.where(inArray(questions.id, questionIds));

	const optionRows = await db
		.select({
			questionId: questionOptions.questionId,
			optionKey: questionOptions.optionKey,
			optionText: questionOptions.optionText,
			isCorrect: questionOptions.isCorrect,
			explanation: questionOptions.explanation
		})
		.from(questionOptions)
		.where(inArray(questionOptions.questionId, questionIds))
		.orderBy(asc(questionOptions.optionKey));

	const serviceRows = await db
		.select({ questionId: questionServices.questionId, serviceName: questionServices.serviceName })
		.from(questionServices)
		.where(inArray(questionServices.questionId, questionIds));

	const optionsByQuestion = new Map<number, ReviewQuestion['options']>();
	for (const o of optionRows) {
		const list = optionsByQuestion.get(o.questionId) ?? [];
		list.push({
			optionKey: o.optionKey,
			optionText: o.optionText,
			isCorrect: o.isCorrect,
			explanation: o.explanation
		});
		optionsByQuestion.set(o.questionId, list);
	}

	const servicesByQuestion = new Map<number, string[]>();
	for (const s of serviceRows) {
		const list = servicesByQuestion.get(s.questionId) ?? [];
		list.push(s.serviceName);
		servicesByQuestion.set(s.questionId, list);
	}

	const questionsById = new Map(questionRows.map((q) => [q.id, q]));

	return answerRows
		.map((answer, index) => {
			const question = questionsById.get(answer.questionId);
			if (!question) return null;

			const options = optionsByQuestion.get(answer.questionId) ?? [];

			return {
				questionId: answer.questionId,
				questionNumber: index + 1,
				questionText: question.questionText,
				questionType: question.questionType,
				difficulty: question.difficulty,
				domainName: question.domainName,
				subcategory: question.subcategory,
				explanation: question.explanation,
				keyConcept: question.keyConcept,
				reference: question.reference,
				selected: JSON.parse(answer.selectedAnswers) as string[],
				correctKeys: options.filter((o) => o.isCorrect).map((o) => o.optionKey),
				isCorrect: answer.isCorrect === true,
				flagged: answer.flagged,
				options,
				services: servicesByQuestion.get(answer.questionId) ?? []
			} satisfies ReviewQuestion;
		})
		.filter((q): q is ReviewQuestion => q !== null);
}

export function filterReviewQuestions(
	questions: ReviewQuestion[],
	filter: ReviewFilter
): ReviewQuestion[] {
	switch (filter) {
		case 'correct':
			return questions.filter((q) => q.isCorrect);
		case 'incorrect':
			return questions.filter((q) => !q.isCorrect);
		case 'flagged':
			return questions.filter((q) => q.flagged);
		default:
			return questions;
	}
}

export interface ExamHistoryItem {
	id: number;
	score: number | null;
	correctCount: number | null;
	incorrectCount: number | null;
	passed: boolean;
	completedAt: string | null;
	startedAt: string;
	examCode: string;
	passingScore: number;
}

export async function listExamHistory(): Promise<ExamHistoryItem[]> {
	const rows = await db
		.select({
			id: examSessions.id,
			score: examSessions.score,
			correctCount: examSessions.correctCount,
			incorrectCount: examSessions.incorrectCount,
			startedAt: examSessions.startedAt,
			completedAt: examSessions.completedAt,
			examCode: examProfiles.code,
			passingScore: examProfiles.passingScore
		})
		.from(examSessions)
		.innerJoin(examProfiles, eq(examSessions.examProfileId, examProfiles.id))
		.where(and(eq(examSessions.mode, 'exam'), eq(examSessions.status, 'completed')))
		.orderBy(sql`${examSessions.completedAt} DESC`)
		.limit(50);

	return rows.map((row) => ({
		...row,
		passed: (row.score ?? 0) >= row.passingScore
	}));
}

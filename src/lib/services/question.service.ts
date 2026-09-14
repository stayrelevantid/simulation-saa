import { db } from '$lib/db/client';
import {
	questions,
	questionOptions,
	questionServices,
	examAnswers,
	examSessions,
	examDomains
} from '$lib/db/schema';
import { and, eq, inArray, sql, desc, asc } from 'drizzle-orm';
import type { Difficulty, QuestionType } from '$lib/types/question';

export interface SelectedQuestion {
	id: number;
	questionText: string;
	questionType: QuestionType;
	difficulty: Difficulty;
	domainName: string;
	subcategory: string | null;
	explanation: string;
	keyConcept: string | null;
	reference: string | null;
	options: {
		optionKey: string;
		optionText: string;
		isCorrect: boolean;
		explanation: string | null;
	}[];
	services: string[];
}

export interface SelectionConfig {
	count: number;
	domainId?: number;
	difficulty?: Difficulty[];
	questionType?: QuestionType[];
	excludeIds?: number[];
}

export interface PracticeConfig extends SelectionConfig {
	mode: 'practice' | 'wrong';
}

function shuffle<T>(array: T[]): T[] {
	const copy = [...array];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export async function selectQuestions(config: SelectionConfig): Promise<SelectedQuestion[]> {
	const conditions = [];

	if (config.domainId) conditions.push(eq(questions.domainId, config.domainId));
	if (config.difficulty && config.difficulty.length > 0) {
		conditions.push(inArray(questions.difficulty, config.difficulty));
	}
	if (config.questionType && config.questionType.length > 0) {
		conditions.push(inArray(questions.questionType, config.questionType));
	}
	if (config.excludeIds && config.excludeIds.length > 0) {
		conditions.push(sql`${questions.id} NOT IN ${config.excludeIds}`);
	}

	let query = db
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
		.$dynamic();

	if (conditions.length > 0) query = query.where(and(...conditions));

	const rows = await query.orderBy(sql`RANDOM()`).limit(config.count);

	if (rows.length === 0) return [];

	const questionIds = rows.map((r) => r.id);

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

	const optionsByQuestion = new Map<number, SelectedQuestion['options']>();
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

	return rows.map((row) => ({
		id: row.id,
		questionText: row.questionText,
		questionType: row.questionType as QuestionType,
		difficulty: row.difficulty as Difficulty,
		domainName: row.domainName,
		subcategory: row.subcategory,
		explanation: row.explanation,
		keyConcept: row.keyConcept,
		reference: row.reference,
		options: optionsByQuestion.get(row.id) ?? [],
		services: servicesByQuestion.get(row.id) ?? []
	}));
}

export async function selectWrongQuestions(count: number): Promise<SelectedQuestion[]> {
	const wrongRows = await db
		.selectDistinct({ questionId: examAnswers.questionId, attempts: sql<number>`count(*)` })
		.from(examAnswers)
		.where(eq(examAnswers.isCorrect, false))
		.groupBy(examAnswers.questionId)
		.orderBy(desc(sql`count(*)`))
		.limit(count);

	if (wrongRows.length === 0) return [];

	const ids = wrongRows.map((r) => r.questionId);
	const selected = await selectQuestions({ count: ids.length });

	return selected.filter((q) => ids.includes(q.id));
}

export async function createPracticeSession(config: PracticeConfig): Promise<number> {
	const [session] = await db
		.insert(examSessions)
		.values({
			examProfileId: 1,
			mode: `practice_${config.mode}`,
			startedAt: new Date().toISOString(),
			status: 'active'
		})
		.returning();
	return session.id;
}

export async function getPracticeSession(sessionId: number) {
	const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));
	return session ?? null;
}

export async function countAvailableQuestions(
	config: Omit<SelectionConfig, 'count' | 'excludeIds'>
): Promise<number> {
	const conditions = [];

	if (config.domainId) conditions.push(eq(questions.domainId, config.domainId));
	if (config.difficulty && config.difficulty.length > 0) {
		conditions.push(inArray(questions.difficulty, config.difficulty));
	}
	if (config.questionType && config.questionType.length > 0) {
		conditions.push(inArray(questions.questionType, config.questionType));
	}

	let query = db
		.select({ count: sql<number>`count(*)` })
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.$dynamic();

	if (conditions.length > 0) query = query.where(and(...conditions));

	const [row] = await query;
	return row?.count ?? 0;
}

export async function countWrongQuestions(): Promise<number> {
	const [row] = await db
		.select({ count: sql<number>`count(DISTINCT ${examAnswers.questionId})` })
		.from(examAnswers)
		.where(eq(examAnswers.isCorrect, false));
	return row?.count ?? 0;
}

export { shuffle };

import { db } from '$lib/db/client';
import {
	questions,
	questionOptions,
	questionServices,
	examDomains,
	examProfiles,
	bookmarks
} from '$lib/db/schema';
import type {
	QuestionListItem,
	QuestionDetail,
	QuestionFilters,
	QuestionType,
	Difficulty,
	QuestionSource
} from '$lib/types/question';
import { and, asc, eq, inArray, like, sql } from 'drizzle-orm';

type QuestionRow = {
	id: number;
	questionText: string;
	questionType: string;
	difficulty: string;
	domainName: string;
	subcategory: string | null;
	source: string;
	bookmarked: number | null;
};

function toListItem(row: QuestionRow, services: string[]): QuestionListItem {
	return {
		id: row.id,
		questionText: row.questionText,
		questionType: row.questionType as QuestionType,
		difficulty: row.difficulty as Difficulty,
		domainName: row.domainName,
		subcategory: row.subcategory,
		source: row.source as QuestionSource,
		services,
		bookmarked: row.bookmarked !== null
	};
}

function mapServices(
	rows: QuestionRow[],
	serviceRows: { questionId: number; serviceName: string }[]
): QuestionListItem[] {
	const servicesByQuestion = new Map<number, string[]>();
	for (const s of serviceRows) {
		const list = servicesByQuestion.get(s.questionId) ?? [];
		list.push(s.serviceName);
		servicesByQuestion.set(s.questionId, list);
	}
	return rows.map((row) => toListItem(row, servicesByQuestion.get(row.id) ?? []));
}

export async function listQuestions(filters: QuestionFilters = {}): Promise<QuestionListItem[]> {
	const conditions = [];

	if (filters.domainId) conditions.push(eq(questions.domainId, filters.domainId));
	if (filters.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty));
	if (filters.questionType) conditions.push(eq(questions.questionType, filters.questionType));
	if (filters.search) conditions.push(like(questions.questionText, `%${filters.search}%`));
	if (filters.bookmarkedOnly) conditions.push(sql`${bookmarks.id} IS NOT NULL`);

	let query = db
		.select({
			id: questions.id,
			questionText: questions.questionText,
			questionType: questions.questionType,
			difficulty: questions.difficulty,
			domainName: examDomains.name,
			subcategory: questions.subcategory,
			source: questions.source,
			bookmarked: bookmarks.id
		})
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.leftJoin(bookmarks, eq(bookmarks.questionId, questions.id))
		.$dynamic();

	if (conditions.length > 0) query = query.where(and(...conditions));
	if (filters.limit) query = query.limit(filters.limit);
	if (filters.offset) query = query.offset(filters.offset);

	const rows = await query.orderBy(asc(questions.id));

	if (rows.length === 0) return [];

	const serviceRows = await db
		.select({ questionId: questionServices.questionId, serviceName: questionServices.serviceName })
		.from(questionServices)
		.where(
			inArray(
				questionServices.questionId,
				rows.map((r) => r.id)
			)
		);

	return mapServices(rows, serviceRows);
}

export async function countQuestions(filters: QuestionFilters = {}): Promise<number> {
	const conditions = [];

	if (filters.domainId) conditions.push(eq(questions.domainId, filters.domainId));
	if (filters.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty));
	if (filters.questionType) conditions.push(eq(questions.questionType, filters.questionType));
	if (filters.search) conditions.push(like(questions.questionText, `%${filters.search}%`));
	if (filters.bookmarkedOnly) conditions.push(sql`${bookmarks.id} IS NOT NULL`);

	let query = db
		.select({ count: sql<number>`count(*)` })
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.leftJoin(bookmarks, eq(bookmarks.questionId, questions.id))
		.$dynamic();

	if (conditions.length > 0) query = query.where(and(...conditions));

	const [row] = await query;
	return row?.count ?? 0;
}

export async function getQuestion(id: number): Promise<QuestionDetail | null> {
	const [row] = await db
		.select({
			id: questions.id,
			examProfileId: questions.examProfileId,
			questionText: questions.questionText,
			questionType: questions.questionType,
			difficulty: questions.difficulty,
			domainName: examDomains.name,
			subcategory: questions.subcategory,
			explanation: questions.explanation,
			keyConcept: questions.keyConcept,
			reference: questions.reference,
			source: questions.source,
			createdAt: questions.createdAt,
			updatedAt: questions.updatedAt,
			bookmarked: bookmarks.id
		})
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.leftJoin(bookmarks, eq(bookmarks.questionId, questions.id))
		.where(eq(questions.id, id));

	if (!row) return null;

	const options = await db
		.select({
			id: questionOptions.id,
			optionKey: questionOptions.optionKey,
			optionText: questionOptions.optionText,
			isCorrect: questionOptions.isCorrect,
			explanation: questionOptions.explanation
		})
		.from(questionOptions)
		.where(eq(questionOptions.questionId, id))
		.orderBy(asc(questionOptions.optionKey));

	const services = await db
		.select({ serviceName: questionServices.serviceName })
		.from(questionServices)
		.where(eq(questionServices.questionId, id));

	return {
		id: row.id,
		examProfileId: row.examProfileId,
		questionText: row.questionText,
		questionType: row.questionType as QuestionType,
		difficulty: row.difficulty as Difficulty,
		domainName: row.domainName,
		subcategory: row.subcategory,
		explanation: row.explanation,
		keyConcept: row.keyConcept,
		reference: row.reference,
		source: row.source as QuestionSource,
		services: services.map((s) => s.serviceName),
		bookmarked: row.bookmarked !== null,
		options,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function toggleBookmark(questionId: number): Promise<boolean> {
	const existing = await db.select().from(bookmarks).where(eq(bookmarks.questionId, questionId));

	if (existing.length > 0) {
		await db.delete(bookmarks).where(eq(bookmarks.questionId, questionId));
		return false;
	}

	await db.insert(bookmarks).values({ questionId, createdAt: new Date().toISOString() });
	return true;
}

export async function listBookmarkedQuestions(): Promise<QuestionListItem[]> {
	const rows = await db
		.select({ questionId: bookmarks.questionId })
		.from(bookmarks)
		.orderBy(asc(bookmarks.createdAt));

	if (rows.length === 0) return [];
	return listQuestionsByIds(rows.map((r) => r.questionId));
}

export async function listQuestionsByIds(ids: number[]): Promise<QuestionListItem[]> {
	if (ids.length === 0) return [];

	const rows = await db
		.select({
			id: questions.id,
			questionText: questions.questionText,
			questionType: questions.questionType,
			difficulty: questions.difficulty,
			domainName: examDomains.name,
			subcategory: questions.subcategory,
			source: questions.source,
			bookmarked: bookmarks.id
		})
		.from(questions)
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.leftJoin(bookmarks, eq(bookmarks.questionId, questions.id))
		.where(inArray(questions.id, ids))
		.orderBy(asc(questions.id));

	if (rows.length === 0) return [];

	const serviceRows = await db
		.select({ questionId: questionServices.questionId, serviceName: questionServices.serviceName })
		.from(questionServices)
		.where(
			inArray(
				questionServices.questionId,
				rows.map((r) => r.id)
			)
		);

	return mapServices(rows, serviceRows);
}

export async function listDomains() {
	return db
		.select({
			id: examDomains.id,
			name: examDomains.name,
			weight: examDomains.weight,
			examCode: examProfiles.code
		})
		.from(examDomains)
		.innerJoin(examProfiles, eq(examDomains.examProfileId, examProfiles.id))
		.orderBy(asc(examDomains.id));
}

export async function listServices(): Promise<string[]> {
	const rows = await db
		.selectDistinct({ serviceName: questionServices.serviceName })
		.from(questionServices)
		.orderBy(asc(questionServices.serviceName));
	return rows.map((r) => r.serviceName);
}

export async function deleteQuestion(id: number): Promise<void> {
	await db.transaction((tx) => {
		tx.delete(questionOptions).where(eq(questionOptions.questionId, id)).run();
		tx.delete(questionServices).where(eq(questionServices.questionId, id)).run();
		tx.delete(bookmarks).where(eq(bookmarks.questionId, id)).run();
		tx.delete(questions).where(eq(questions.id, id)).run();
	});
}

import { db } from '$lib/db/client';
import {
	examProfiles,
	examDomains,
	examSessions,
	examAnswers,
	questions,
	questionOptions,
	questionServices,
	questionBlueprints
} from '$lib/db/schema';
import { and, eq, sql, asc, inArray } from 'drizzle-orm';
import type { SelectedQuestion } from '$lib/services/question.service';

export interface ExamSessionInfo {
	id: number;
	examProfileId: number;
	mode: string;
	startedAt: string;
	completedAt: string | null;
	timeLimitSeconds: number | null;
	score: number | null;
	correctCount: number | null;
	incorrectCount: number | null;
	status: string;
}

export async function getActiveExamSession(profileCode: string): Promise<ExamSessionInfo | null> {
	const [session] = await db
		.select({
			id: examSessions.id,
			examProfileId: examSessions.examProfileId,
			mode: examSessions.mode,
			startedAt: examSessions.startedAt,
			completedAt: examSessions.completedAt,
			timeLimitSeconds: examSessions.timeLimitSeconds,
			score: examSessions.score,
			correctCount: examSessions.correctCount,
			incorrectCount: examSessions.incorrectCount,
			status: examSessions.status
		})
		.from(examSessions)
		.innerJoin(examProfiles, eq(examSessions.examProfileId, examProfiles.id))
		.where(
			and(
				eq(examProfiles.code, profileCode),
				eq(examSessions.mode, 'exam'),
				eq(examSessions.status, 'active')
			)
		)
		.orderBy(sql`${examSessions.startedAt} DESC`)
		.limit(1);

	return session ?? null;
}

export async function getSessionById(sessionId: number): Promise<ExamSessionInfo | null> {
	const [session] = await db.select().from(examSessions).where(eq(examSessions.id, sessionId));
	return session ?? null;
}

interface DomainWeight {
	domainId: number;
	weight: number;
}

export async function selectExamQuestions(
	profileId: number,
	totalQuestions: number
): Promise<SelectedQuestion[]> {
	const blueprint = await db
		.select({
			domainId: questionBlueprints.domainId,
			weight: examDomains.weight
		})
		.from(questionBlueprints)
		.innerJoin(examDomains, eq(questionBlueprints.domainId, examDomains.id))
		.where(eq(questionBlueprints.examProfileId, profileId));

	const domainWeights: DomainWeight[] =
		blueprint.length > 0
			? blueprint.map((b) => ({ domainId: b.domainId, weight: b.weight }))
			: (
					await db
						.select({ domainId: examDomains.id, weight: examDomains.weight })
						.from(examDomains)
						.where(eq(examDomains.examProfileId, profileId))
				).map((d) => ({ domainId: d.domainId, weight: d.weight }));

	const totalWeight = domainWeights.reduce((sum, d) => sum + d.weight, 0) || 1;

	const allocations = domainWeights.map((d) => ({
		domainId: d.domainId,
		count: Math.max(1, Math.floor((d.weight / totalWeight) * totalQuestions))
	}));

	let allocated = allocations.reduce((sum, a) => sum + a.count, 0);
	let idx = 0;
	while (allocated < totalQuestions && allocations.length > 0) {
		allocations[idx % allocations.length].count += 1;
		allocated += 1;
		idx += 1;
	}

	const allSelected: SelectedQuestion[] = [];
	for (const alloc of allocations) {
		const rows = await db
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
			.where(eq(questions.domainId, alloc.domainId))
			.orderBy(sql`RANDOM()`)
			.limit(alloc.count);

		allSelected.push(
			...rows.map((row) => ({
				id: row.id,
				questionText: row.questionText,
				questionType: row.questionType as SelectedQuestion['questionType'],
				difficulty: row.difficulty as SelectedQuestion['difficulty'],
				domainName: row.domainName,
				subcategory: row.subcategory,
				explanation: row.explanation,
				keyConcept: row.keyConcept,
				reference: row.reference,
				options: [] as SelectedQuestion['options'],
				services: [] as string[]
			}))
		);
	}

	const questionIds = allSelected.map((q) => q.id);
	if (questionIds.length === 0) return [];

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

	const shuffled = allSelected
		.map((q) => ({
			...q,
			options: optionsByQuestion.get(q.id) ?? [],
			services: servicesByQuestion.get(q.id) ?? []
		}))
		.sort(() => Math.random() - 0.5);

	return shuffled;
}

export async function startExamSession(
	profileId: number,
	durationMinutes: number
): Promise<number> {
	const [session] = await db
		.insert(examSessions)
		.values({
			examProfileId: profileId,
			mode: 'exam',
			startedAt: new Date().toISOString(),
			timeLimitSeconds: durationMinutes * 60,
			status: 'active'
		})
		.returning();
	return session.id;
}

export async function getExamQuestionIds(sessionId: number): Promise<number[]> {
	const rows = await db
		.select({ questionId: examAnswers.questionId })
		.from(examAnswers)
		.where(eq(examAnswers.examSessionId, sessionId))
		.orderBy(asc(examAnswers.id));
	return rows.map((r) => r.questionId);
}

export async function saveExamAnswer(
	sessionId: number,
	questionId: number,
	selected: string[],
	flagged: boolean,
	isCorrect: boolean | null
): Promise<void> {
	const existing = await db
		.select()
		.from(examAnswers)
		.where(and(eq(examAnswers.examSessionId, sessionId), eq(examAnswers.questionId, questionId)));

	if (existing.length > 0) {
		await db
			.update(examAnswers)
			.set({
				selectedAnswers: JSON.stringify(selected),
				flagged,
				isCorrect: selected.length === 0 ? null : isCorrect,
				answeredAt: new Date().toISOString()
			})
			.where(eq(examAnswers.id, existing[0].id));
		return;
	}

	await db.insert(examAnswers).values({
		examSessionId: sessionId,
		questionId,
		selectedAnswers: JSON.stringify(selected),
		flagged,
		isCorrect,
		answeredAt: new Date().toISOString()
	});
}

export async function getRemainingSeconds(sessionId: number): Promise<number> {
	const session = await getSessionById(sessionId);
	if (!session) return 0;

	const startedMs = new Date(session.startedAt).getTime();
	const elapsed = Math.floor((Date.now() - startedMs) / 1000);
	const limit = session.timeLimitSeconds ?? 0;
	return Math.max(0, limit - elapsed);
}

export function computeEstimatedScore(
	correctCount: number,
	totalQuestions: number,
	scoreMin: number,
	scoreMax: number
): number {
	if (totalQuestions === 0) return scoreMin;
	const percentage = correctCount / totalQuestions;
	return Math.round(scoreMin + percentage * (scoreMax - scoreMin));
}

export async function submitExamSession(sessionId: number): Promise<ExamSessionInfo | null> {
	const session = await getSessionById(sessionId);
	if (!session || session.status !== 'active') return session;

	const answers = await db
		.select({
			isCorrect: examAnswers.isCorrect,
			selectedAnswers: examAnswers.selectedAnswers
		})
		.from(examAnswers)
		.where(eq(examAnswers.examSessionId, sessionId));

	const answered = answers.filter((a) => JSON.parse(a.selectedAnswers).length > 0);
	const correctCount = answered.filter((a) => a.isCorrect === true).length;
	const incorrectCount = answered.filter((a) => a.isCorrect === false).length;

	const [profile] = await db
		.select()
		.from(examProfiles)
		.where(eq(examProfiles.id, session.examProfileId));

	const estimatedScore = computeEstimatedScore(
		correctCount,
		profile?.questionCount ?? answered.length,
		profile?.scoreMin ?? 100,
		profile?.scoreMax ?? 1000
	);

	await db
		.update(examSessions)
		.set({
			status: 'completed',
			completedAt: new Date().toISOString(),
			score: estimatedScore,
			correctCount,
			incorrectCount
		})
		.where(eq(examSessions.id, sessionId));

	return getSessionById(sessionId);
}

export async function getExamSummary(sessionId: number) {
	const answers = await db
		.select({
			questionId: examAnswers.questionId,
			selectedAnswers: examAnswers.selectedAnswers,
			isCorrect: examAnswers.isCorrect,
			flagged: examAnswers.flagged
		})
		.from(examAnswers)
		.where(eq(examAnswers.examSessionId, sessionId));

	return {
		answered: answers.filter((a) => JSON.parse(a.selectedAnswers).length > 0).length,
		unanswered: answers.filter((a) => JSON.parse(a.selectedAnswers).length === 0).length,
		flagged: answers.filter((a) => a.flagged).length
	};
}

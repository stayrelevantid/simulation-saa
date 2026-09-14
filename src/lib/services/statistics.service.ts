import { db } from '$lib/db/client';
import {
	examAnswers,
	examSessions,
	questions,
	questionServices,
	examDomains,
	examProfiles
} from '$lib/db/schema';
import { and, eq, sql, desc } from 'drizzle-orm';

export interface OverallStats {
	questionsAvailable: number;
	questionsAttempted: number;
	correct: number;
	incorrect: number;
	accuracy: number;
	mockExamCount: number;
	averageScore: number | null;
	wrongQuestionCount: number;
}

export interface DomainStat {
	domainId: number;
	name: string;
	weight: number;
	attempted: number;
	correct: number;
	accuracy: number;
}

export interface ServiceStat {
	serviceName: string;
	attempted: number;
	correct: number;
	accuracy: number;
}

export async function getOverallStats(): Promise<OverallStats> {
	const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);

	const attemptedRows = await db
		.select({
			isCorrect: examAnswers.isCorrect,
			questionId: examAnswers.questionId
		})
		.from(examAnswers)
		.innerJoin(examSessions, eq(examAnswers.examSessionId, examSessions.id))
		.where(sql`${examSessions.mode} LIKE 'practice%'`);

	const answeredQuestionIds = new Set(attemptedRows.map((r) => r.questionId));
	const attemptedRowsPerQuestion = attemptedRows.filter((r) => r.isCorrect !== null);
	const correct = attemptedRowsPerQuestion.filter((r) => r.isCorrect === true).length;
	const incorrect = attemptedRowsPerQuestion.filter((r) => r.isCorrect === false).length;

	const wrongQuestionIds = new Set(
		attemptedRowsPerQuestion.filter((r) => r.isCorrect === false).map((r) => r.questionId)
	);

	const [examStats] = await db
		.select({
			count: sql<number>`count(*)`,
			avgScore: sql<number | null>`avg(${examSessions.score})`
		})
		.from(examSessions)
		.where(and(eq(examSessions.mode, 'exam'), eq(examSessions.status, 'completed')));

	const totalAnswered = correct + incorrect;

	return {
		questionsAvailable: questionCount?.count ?? 0,
		questionsAttempted: answeredQuestionIds.size,
		correct,
		incorrect,
		accuracy: totalAnswered > 0 ? correct / totalAnswered : 0,
		mockExamCount: examStats?.count ?? 0,
		averageScore: examStats?.avgScore != null ? Math.round(examStats.avgScore) : null,
		wrongQuestionCount: wrongQuestionIds.size
	};
}

export async function getDomainStats(): Promise<DomainStat[]> {
	const domains = await db
		.select({
			id: examDomains.id,
			name: examDomains.name,
			weight: examDomains.weight
		})
		.from(examDomains)
		.innerJoin(examProfiles, eq(examDomains.examProfileId, examProfiles.id))
		.where(eq(examProfiles.code, 'SAA-C03'));

	const stats = await db
		.select({
			domainId: examDomains.id,
			attempted: sql<number>`sum(CASE WHEN ${examAnswers.isCorrect} IS NOT NULL THEN 1 ELSE 0 END)`,
			correct: sql<number>`sum(CASE WHEN ${examAnswers.isCorrect} = 1 THEN 1 ELSE 0 END)`
		})
		.from(examAnswers)
		.innerJoin(examSessions, eq(examAnswers.examSessionId, examSessions.id))
		.innerJoin(questions, eq(examAnswers.questionId, questions.id))
		.innerJoin(examDomains, eq(questions.domainId, examDomains.id))
		.where(sql`${examSessions.mode} LIKE 'practice%'`)
		.groupBy(examDomains.id);

	const statsByDomain = new Map(stats.map((s) => [s.domainId, s]));

	return domains.map((domain) => {
		const stat = statsByDomain.get(domain.id);
		const attempted = Number(stat?.attempted ?? 0);
		const correct = Number(stat?.correct ?? 0);
		return {
			domainId: domain.id,
			name: domain.name,
			weight: domain.weight,
			attempted,
			correct,
			accuracy: attempted > 0 ? correct / attempted : 0
		};
	});
}

export async function getServiceStats(): Promise<ServiceStat[]> {
	const stats = await db
		.select({
			serviceName: questionServices.serviceName,
			attempted: sql<number>`sum(CASE WHEN ${examAnswers.isCorrect} IS NOT NULL THEN 1 ELSE 0 END)`,
			correct: sql<number>`sum(CASE WHEN ${examAnswers.isCorrect} = 1 THEN 1 ELSE 0 END)`
		})
		.from(examAnswers)
		.innerJoin(examSessions, eq(examAnswers.examSessionId, examSessions.id))
		.innerJoin(questions, eq(examAnswers.questionId, questions.id))
		.innerJoin(questionServices, eq(questionServices.questionId, questions.id))
		.where(sql`${examSessions.mode} LIKE 'practice%'`)
		.groupBy(questionServices.serviceName)
		.orderBy(
			desc(
				sql`sum(CASE WHEN ${examAnswers.isCorrect} = 1 THEN 1 ELSE 0 END) * 1.0 / max(1, sum(CASE WHEN ${examAnswers.isCorrect} IS NOT NULL THEN 1 ELSE 0 END))`
			)
		);

	return stats.map((stat) => {
		const attempted = Number(stat.attempted);
		const correct = Number(stat.correct);
		return {
			serviceName: stat.serviceName,
			attempted,
			correct,
			accuracy: attempted > 0 ? correct / attempted : 0
		};
	});
}

export async function getWeakDomains(limit = 3): Promise<DomainStat[]> {
	const stats = await getDomainStats();
	return stats
		.filter((s) => s.attempted > 0)
		.sort((a, b) => a.accuracy - b.accuracy)
		.slice(0, limit);
}

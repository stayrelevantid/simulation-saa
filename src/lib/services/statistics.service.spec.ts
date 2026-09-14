import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '$lib/db/schema';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let getOverallStats: typeof import('./statistics.service').getOverallStats;
let getDomainStats: typeof import('./statistics.service').getDomainStats;
let getServiceStats: typeof import('./statistics.service').getServiceStats;
let getWeakDomains: typeof import('./statistics.service').getWeakDomains;

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const service = await import('./statistics.service');
	getOverallStats = service.getOverallStats;
	getDomainStats = service.getDomainStats;
	getServiceStats = service.getServiceStats;
	getWeakDomains = service.getWeakDomains;

	await testDb.insert(schema.examProfiles).values({
		code: 'SAA-C03',
		name: 'AWS Certified Solutions Architect – Associate',
		questionCount: 65,
		durationMinutes: 130,
		passingScore: 720,
		scoreMin: 100,
		scoreMax: 1000
	});
	const [domain1, domain2] = await testDb
		.insert(schema.examDomains)
		.values([
			{ examProfileId: 1, name: 'Resilient Architecture', weight: 0.5 },
			{ examProfileId: 1, name: 'Secure Architecture', weight: 0.5 }
		])
		.returning();

	const now = new Date().toISOString();
	const questionsData = [
		{ id: 1, domainId: domain1.id },
		{ id: 2, domainId: domain1.id },
		{ id: 3, domainId: domain2.id }
	];
	for (const q of questionsData) {
		await testDb.insert(schema.questions).values({
			id: q.id,
			examProfileId: 1,
			questionText: `Question ${q.id}`,
			questionType: 'single',
			difficulty: 'medium',
			domainId: q.domainId,
			explanation: 'Exp',
			source: 'import',
			createdAt: now,
			updatedAt: now
		});
	}
	await testDb.insert(schema.questionServices).values([
		{ questionId: 1, serviceName: 'Amazon S3' },
		{ questionId: 2, serviceName: 'Amazon S3' },
		{ questionId: 3, serviceName: 'Amazon VPC' }
	]);

	await testDb.insert(schema.examSessions).values([
		{ id: 10, examProfileId: 1, mode: 'practice_practice', startedAt: now, status: 'active' },
		{
			id: 11,
			examProfileId: 1,
			mode: 'exam',
			startedAt: now,
			completedAt: now,
			score: 800,
			status: 'completed'
		},
		{
			id: 12,
			examProfileId: 1,
			mode: 'exam',
			startedAt: now,
			completedAt: now,
			score: 600,
			status: 'completed'
		}
	]);

	await testDb.insert(schema.examAnswers).values([
		{
			examSessionId: 10,
			questionId: 1,
			selectedAnswers: '["A"]',
			isCorrect: true,
			answeredAt: now
		},
		{
			examSessionId: 10,
			questionId: 2,
			selectedAnswers: '["B"]',
			isCorrect: false,
			answeredAt: now
		},
		{
			examSessionId: 10,
			questionId: 3,
			selectedAnswers: '["C"]',
			isCorrect: false,
			answeredAt: now
		}
	]);
});

afterAll(() => {
	sqlite.close();
});

describe('getOverallStats', () => {
	it('computes overall practice statistics', async () => {
		const stats = await getOverallStats();
		expect(stats.questionsAvailable).toBe(3);
		expect(stats.questionsAttempted).toBe(3);
		expect(stats.correct).toBe(1);
		expect(stats.incorrect).toBe(2);
		expect(stats.accuracy).toBeCloseTo(1 / 3);
		expect(stats.wrongQuestionCount).toBe(2);
	});

	it('counts completed mock exams and average score', async () => {
		const stats = await getOverallStats();
		expect(stats.mockExamCount).toBe(2);
		expect(stats.averageScore).toBe(700);
	});
});

describe('getDomainStats', () => {
	it('computes per-domain accuracy', async () => {
		const stats = await getDomainStats();
		expect(stats).toHaveLength(2);

		const resilient = stats.find((s) => s.name === 'Resilient Architecture');
		const secure = stats.find((s) => s.name === 'Secure Architecture');

		expect(resilient?.attempted).toBe(2);
		expect(resilient?.correct).toBe(1);
		expect(resilient?.accuracy).toBeCloseTo(0.5);

		expect(secure?.attempted).toBe(1);
		expect(secure?.correct).toBe(0);
		expect(secure?.accuracy).toBe(0);
	});
});

describe('getServiceStats', () => {
	it('computes per-service accuracy', async () => {
		const stats = await getServiceStats();
		expect(stats).toHaveLength(2);

		const s3 = stats.find((s) => s.serviceName === 'Amazon S3');
		const vpc = stats.find((s) => s.serviceName === 'Amazon VPC');

		expect(s3?.attempted).toBe(2);
		expect(s3?.correct).toBe(1);
		expect(vpc?.attempted).toBe(1);
		expect(vpc?.correct).toBe(0);
	});
});

describe('getWeakDomains', () => {
	it('returns domains sorted by lowest accuracy', async () => {
		const weak = await getWeakDomains();
		expect(weak).toHaveLength(2);
		expect(weak[0].name).toBe('Secure Architecture');
		expect(weak[1].name).toBe('Resilient Architecture');
	});

	it('respects limit', async () => {
		const weak = await getWeakDomains(1);
		expect(weak).toHaveLength(1);
		expect(weak[0].name).toBe('Secure Architecture');
	});
});

import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '$lib/db/schema';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let selectQuestions: typeof import('./question.service').selectQuestions;
let countAvailableQuestions: typeof import('./question.service').countAvailableQuestions;
let countWrongQuestions: typeof import('./question.service').countWrongQuestions;
let listServiceCounts: typeof import('./question.service').listServiceCounts;

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const service = await import('./question.service');
	selectQuestions = service.selectQuestions;
	countAvailableQuestions = service.countAvailableQuestions;
	countWrongQuestions = service.countWrongQuestions;
	listServiceCounts = service.listServiceCounts;

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
	const seed = [
		{ id: 1, domainId: domain1.id, difficulty: 'easy', type: 'single' },
		{ id: 2, domainId: domain1.id, difficulty: 'medium', type: 'single' },
		{ id: 3, domainId: domain1.id, difficulty: 'hard', type: 'multiple' },
		{ id: 4, domainId: domain2.id, difficulty: 'easy', type: 'multiple' },
		{ id: 5, domainId: domain2.id, difficulty: 'medium', type: 'single' },
		{ id: 6, domainId: domain2.id, difficulty: 'hard', type: 'multiple' }
	];
	for (const q of seed) {
		await testDb.insert(schema.questions).values({
			id: q.id,
			examProfileId: 1,
			questionText: `Question ${q.id} text`,
			questionType: q.type,
			difficulty: q.difficulty,
			domainId: q.domainId,
			explanation: 'Exp',
			source: 'import',
			createdAt: now,
			updatedAt: now
		});
		await testDb.insert(schema.questionOptions).values([
			{ questionId: q.id, optionKey: 'A', optionText: 'A', isCorrect: true },
			{ questionId: q.id, optionKey: 'B', optionText: 'B', isCorrect: false }
		]);
	}

	await testDb.insert(schema.questionServices).values([
		{ questionId: 1, serviceName: 'Amazon S3' },
		{ questionId: 2, serviceName: 'Amazon S3' },
		{ questionId: 2, serviceName: 'Amazon EC2' },
		{ questionId: 3, serviceName: 'Amazon EC2' },
		{ questionId: 4, serviceName: 'AWS Lambda' },
		{ questionId: 5, serviceName: 'Amazon RDS' },
		{ questionId: 6, serviceName: 'Amazon S3' },
		{ questionId: 6, serviceName: 'Amazon RDS' }
	]);

	await testDb.insert(schema.examSessions).values({
		id: 10,
		examProfileId: 1,
		mode: 'practice_practice',
		startedAt: now,
		status: 'active'
	});
	await testDb.insert(schema.examAnswers).values([
		{
			examSessionId: 10,
			questionId: 1,
			selectedAnswers: '["A"]',
			isCorrect: false,
			answeredAt: now
		},
		{
			examSessionId: 10,
			questionId: 2,
			selectedAnswers: '["A"]',
			isCorrect: false,
			answeredAt: now
		},
		{ examSessionId: 10, questionId: 3, selectedAnswers: '["A"]', isCorrect: true, answeredAt: now }
	]);
});

afterAll(() => {
	sqlite.close();
});

describe('selectQuestions with multi-select filters', () => {
	it('filters by single difficulty', async () => {
		const result = await selectQuestions({ count: 10, difficulty: ['easy'] });
		expect(result).toHaveLength(2);
		expect(result.every((q) => q.difficulty === 'easy')).toBe(true);
	});

	it('filters by multiple difficulties', async () => {
		const result = await selectQuestions({ count: 10, difficulty: ['easy', 'medium'] });
		expect(result).toHaveLength(4);
		expect(result.every((q) => q.difficulty !== 'hard')).toBe(true);
	});

	it('filters by both question types', async () => {
		const result = await selectQuestions({ count: 10, questionType: ['single', 'multiple'] });
		expect(result).toHaveLength(6);
	});

	it('filters by single question type', async () => {
		const result = await selectQuestions({ count: 10, questionType: ['multiple'] });
		expect(result).toHaveLength(3);
	});

	it('combines domain and difficulty filters', async () => {
		const result = await selectQuestions({ count: 10, domainId: 2, difficulty: ['easy'] });
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe(4);
	});

	it('returns all questions when no filters provided', async () => {
		const result = await selectQuestions({ count: 10 });
		expect(result).toHaveLength(6);
	});

	it('respects count limit', async () => {
		const result = await selectQuestions({ count: 3 });
		expect(result).toHaveLength(3);
	});
});

describe('countAvailableQuestions', () => {
	it('counts all questions without filters', async () => {
		expect(await countAvailableQuestions({})).toBe(6);
	});

	it('counts with difficulty filter', async () => {
		expect(await countAvailableQuestions({ difficulty: ['easy'] })).toBe(2);
	});

	it('counts with multiple difficulties', async () => {
		expect(await countAvailableQuestions({ difficulty: ['easy', 'medium'] })).toBe(4);
	});

	it('counts with question type filter', async () => {
		expect(await countAvailableQuestions({ questionType: ['multiple'] })).toBe(3);
	});

	it('counts with combined filters', async () => {
		expect(
			await countAvailableQuestions({
				domainId: 1,
				difficulty: ['hard'],
				questionType: ['multiple']
			})
		).toBe(1);
	});

	it('returns zero when filters match nothing', async () => {
		expect(
			await countAvailableQuestions({
				domainId: 1,
				difficulty: ['easy'],
				questionType: ['multiple']
			})
		).toBe(0);
	});
});

describe('countWrongQuestions', () => {
	it('counts distinct wrong questions', async () => {
		expect(await countWrongQuestions()).toBe(2);
	});
});

describe('selectQuestions with AWS service filter', () => {
	it('matches questions for a single service', async () => {
		const result = await selectQuestions({ count: 10, services: ['Amazon S3'] });
		expect(result.map((q) => q.id).sort((a, b) => a - b)).toEqual([1, 2, 6]);
	});

	it('matches any of multiple services (OR)', async () => {
		const result = await selectQuestions({ count: 10, services: ['Amazon EC2', 'AWS Lambda'] });
		expect(result.map((q) => q.id).sort((a, b) => a - b)).toEqual([2, 3, 4]);
	});

	it('returns all questions when services are omitted', async () => {
		expect(await selectQuestions({ count: 10 })).toHaveLength(6);
	});

	it('exposes the services attached to each question', async () => {
		const result = await selectQuestions({ count: 10, services: ['Amazon EC2'] });
		const q2 = result.find((q) => q.id === 2);
		expect(q2?.services.sort()).toEqual(['Amazon EC2', 'Amazon S3']);
	});

	it('counts distinct questions for a service', async () => {
		expect(await countAvailableQuestions({ services: ['Amazon S3'] })).toBe(3);
	});

	it('counts with service combined with difficulty', async () => {
		expect(await countAvailableQuestions({ services: ['Amazon S3'], difficulty: ['easy'] })).toBe(
			1
		);
	});

	it('returns zero when no question matches the service', async () => {
		expect(await countAvailableQuestions({ services: ['Amazon Kinesis'] })).toBe(0);
	});
});

describe('listServiceCounts', () => {
	it('returns per-service question counts, highest first', async () => {
		const counts = await listServiceCounts();
		const map = new Map(counts.map((c) => [c.serviceName, c.count]));
		expect(map.get('Amazon S3')).toBe(3);
		expect(map.get('Amazon EC2')).toBe(2);
		expect(map.get('Amazon RDS')).toBe(2);
		expect(map.get('AWS Lambda')).toBe(1);
		expect(counts[0].count).toBeGreaterThanOrEqual(counts[counts.length - 1].count);
	});
});

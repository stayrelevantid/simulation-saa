import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '$lib/db/schema';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let getSessionReview: typeof import('./review.repository').getSessionReview;
let filterReviewQuestions: typeof import('./review.repository').filterReviewQuestions;
let listExamHistory: typeof import('./review.repository').listExamHistory;

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const repo = await import('./review.repository');
	getSessionReview = repo.getSessionReview;
	filterReviewQuestions = repo.filterReviewQuestions;
	listExamHistory = repo.listExamHistory;

	await testDb.insert(schema.examProfiles).values({
		code: 'SAA-C03',
		name: 'AWS Certified Solutions Architect – Associate',
		questionCount: 65,
		durationMinutes: 130,
		passingScore: 720,
		scoreMin: 100,
		scoreMax: 1000
	});
	const [domain] = await testDb
		.insert(schema.examDomains)
		.values({ examProfileId: 1, name: 'Resilient Architecture', weight: 0.26 })
		.returning();

	const now = new Date().toISOString();
	const [q1, q2, q3] = await testDb
		.insert(schema.questions)
		.values([
			{
				examProfileId: 1,
				questionText: 'Q1 text',
				questionType: 'single',
				difficulty: 'medium',
				domainId: domain.id,
				explanation: 'Exp 1',
				source: 'import',
				createdAt: now,
				updatedAt: now
			},
			{
				examProfileId: 1,
				questionText: 'Q2 text',
				questionType: 'multiple',
				difficulty: 'hard',
				domainId: domain.id,
				explanation: 'Exp 2',
				source: 'import',
				createdAt: now,
				updatedAt: now
			},
			{
				examProfileId: 1,
				questionText: 'Q3 text',
				questionType: 'single',
				difficulty: 'easy',
				domainId: domain.id,
				explanation: 'Exp 3',
				source: 'import',
				createdAt: now,
				updatedAt: now
			}
		])
		.returning();

	await testDb.insert(schema.questionOptions).values([
		{ questionId: q1.id, optionKey: 'A', optionText: 'A text', isCorrect: true },
		{ questionId: q1.id, optionKey: 'B', optionText: 'B text', isCorrect: false },
		{ questionId: q2.id, optionKey: 'A', optionText: 'A text', isCorrect: true },
		{ questionId: q2.id, optionKey: 'B', optionText: 'B text', isCorrect: false },
		{ questionId: q2.id, optionKey: 'C', optionText: 'C text', isCorrect: true },
		{ questionId: q3.id, optionKey: 'A', optionText: 'A text', isCorrect: false },
		{ questionId: q3.id, optionKey: 'B', optionText: 'B text', isCorrect: true }
	]);

	await testDb.insert(schema.examSessions).values({
		id: 100,
		examProfileId: 1,
		mode: 'exam',
		startedAt: now,
		completedAt: now,
		timeLimitSeconds: 7800,
		score: 780,
		correctCount: 2,
		incorrectCount: 1,
		status: 'completed'
	});

	await testDb.insert(schema.examAnswers).values([
		{
			examSessionId: 100,
			questionId: q1.id,
			selectedAnswers: '["A"]',
			isCorrect: true,
			flagged: false,
			answeredAt: now
		},
		{
			examSessionId: 100,
			questionId: q2.id,
			selectedAnswers: '["A","B"]',
			isCorrect: false,
			flagged: true,
			answeredAt: now
		},
		{
			examSessionId: 100,
			questionId: q3.id,
			selectedAnswers: '[]',
			isCorrect: null,
			flagged: false,
			answeredAt: now
		}
	]);
});

afterAll(() => {
	sqlite.close();
});

describe('getSessionReview', () => {
	it('returns questions in session order with numbers', async () => {
		const review = await getSessionReview(100);
		expect(review).toHaveLength(3);
		expect(review[0].questionNumber).toBe(1);
		expect(review[1].questionNumber).toBe(2);
		expect(review[2].questionNumber).toBe(3);
	});

	it('includes parsed selected answers and correct keys', async () => {
		const review = await getSessionReview(100);
		expect(review[0].selected).toEqual(['A']);
		expect(review[0].correctKeys).toEqual(['A']);
		expect(review[0].isCorrect).toBe(true);

		expect(review[1].selected).toEqual(['A', 'B']);
		expect(review[1].correctKeys).toEqual(['A', 'C']);
		expect(review[1].isCorrect).toBe(false);
		expect(review[1].flagged).toBe(true);
	});

	it('handles unanswered questions', async () => {
		const review = await getSessionReview(100);
		expect(review[2].selected).toEqual([]);
		expect(review[2].isCorrect).toBe(false);
	});
});

describe('filterReviewQuestions', () => {
	it('filters by correct', async () => {
		const review = await getSessionReview(100);
		expect(filterReviewQuestions(review, 'correct')).toHaveLength(1);
	});

	it('filters by incorrect including unanswered', async () => {
		const review = await getSessionReview(100);
		expect(filterReviewQuestions(review, 'incorrect')).toHaveLength(2);
	});

	it('filters by flagged', async () => {
		const review = await getSessionReview(100);
		expect(filterReviewQuestions(review, 'flagged')).toHaveLength(1);
		expect(filterReviewQuestions(review, 'flagged')[0].questionId).toBe(review[1].questionId);
	});

	it('returns all for all filter', async () => {
		const review = await getSessionReview(100);
		expect(filterReviewQuestions(review, 'all')).toHaveLength(3);
	});
});

describe('listExamHistory', () => {
	it('lists completed exam sessions with pass status', async () => {
		const history = await listExamHistory();
		expect(history).toHaveLength(1);
		expect(history[0].id).toBe(100);
		expect(history[0].examCode).toBe('SAA-C03');
		expect(history[0].passed).toBe(true);
		expect(history[0].score).toBe(780);
	});
});

import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '$lib/db/schema';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let listQuestions: typeof import('./question.repository').listQuestions;
let toggleBookmark: typeof import('./question.repository').toggleBookmark;
let listBookmarkedQuestions: typeof import('./question.repository').listBookmarkedQuestions;
let getQuestion: typeof import('./question.repository').getQuestion;

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const repo = await import('./question.repository');
	listQuestions = repo.listQuestions;
	toggleBookmark = repo.toggleBookmark;
	listBookmarkedQuestions = repo.listBookmarkedQuestions;
	getQuestion = repo.getQuestion;

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
	const [q1] = await testDb
		.insert(schema.questions)
		.values({
			examProfileId: 1,
			questionText: 'Question about S3 storage classes',
			questionType: 'single',
			difficulty: 'medium',
			domainId: domain.id,
			explanation: 'Because lifecycle',
			source: 'import',
			createdAt: now,
			updatedAt: now
		})
		.returning();
	const [q2] = await testDb
		.insert(schema.questions)
		.values({
			examProfileId: 1,
			questionText: 'Question about VPC networking',
			questionType: 'multiple',
			difficulty: 'hard',
			domainId: domain.id,
			explanation: 'Because NAT',
			source: 'manual',
			createdAt: now,
			updatedAt: now
		})
		.returning();

	await testDb.insert(schema.questionOptions).values([
		{ questionId: q1.id, optionKey: 'A', optionText: 'Option A', isCorrect: false },
		{ questionId: q1.id, optionKey: 'B', optionText: 'Option B', isCorrect: true }
	]);
	await testDb.insert(schema.questionServices).values([
		{ questionId: q1.id, serviceName: 'Amazon S3' },
		{ questionId: q2.id, serviceName: 'Amazon VPC' }
	]);
});

afterAll(() => {
	sqlite.close();
});

describe('question.repository', () => {
	it('lists questions with services', async () => {
		const items = await listQuestions();
		expect(items).toHaveLength(2);
		expect(items[0].services).toContain('Amazon S3');
	});

	it('filters by difficulty', async () => {
		const items = await listQuestions({ difficulty: 'hard' });
		expect(items).toHaveLength(1);
		expect(items[0].questionType).toBe('multiple');
	});

	it('filters by search text', async () => {
		const items = await listQuestions({ search: 'VPC' });
		expect(items).toHaveLength(1);
		expect(items[0].services).toContain('Amazon VPC');
	});

	it('toggles bookmark on and off', async () => {
		const added = await toggleBookmark(1);
		expect(added).toBe(true);

		let bookmarked = await listBookmarkedQuestions();
		expect(bookmarked).toHaveLength(1);
		expect(bookmarked[0].id).toBe(1);

		const removed = await toggleBookmark(1);
		expect(removed).toBe(false);
		bookmarked = await listBookmarkedQuestions();
		expect(bookmarked).toHaveLength(0);
	});

	it('returns null for missing question', async () => {
		const detail = await getQuestion(999);
		expect(detail).toBeNull();
	});

	it('returns question detail with options ordered by key', async () => {
		const detail = await getQuestion(1);
		expect(detail).not.toBeNull();
		expect(detail!.options.map((o) => o.optionKey)).toEqual(['A', 'B']);
		expect(detail!.options.find((o) => o.optionKey === 'B')?.isCorrect).toBe(true);
	});
});

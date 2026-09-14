import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/db/schema';
import type { GeneratedQuestion } from '$lib/ai/provider';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let importGeneratedQuestions: typeof import('$lib/ai/import-questions').importGeneratedQuestions;

const question: GeneratedQuestion = {
	question:
		'A logistics company must archive invoices on AWS for 7 years while keeping retrieval within minutes. Which solution should the solutions architect recommend?',
	type: 'single',
	difficulty: 'medium',
	domain: 'resilient_architecture',
	subcategory: 'storage',
	services: ['Amazon S3'],
	options: [
		{ key: 'A', text: 'Option A', correct: true, explanation: 'Meets the requirements.' },
		{ key: 'B', text: 'Option B', correct: false, explanation: 'Does not.' },
		{ key: 'C', text: 'Option C', correct: false, explanation: 'Does not.' },
		{ key: 'D', text: 'Option D', correct: false, explanation: 'Does not.' }
	],
	explanation: 'The recommended option meets all stated requirements.',
	keyConcept: 'Archival storage',
	reference: 'AWS documentation'
};

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const mod = await import('$lib/ai/import-questions');
	importGeneratedQuestions = mod.importGeneratedQuestions;

	await testDb.insert(schema.examProfiles).values({
		code: 'SAA-C03',
		name: 'AWS Certified Solutions Architect – Associate',
		questionCount: 65,
		durationMinutes: 130,
		passingScore: 720,
		scoreMin: 100,
		scoreMax: 1000
	});
	await testDb
		.insert(schema.examDomains)
		.values({ examProfileId: 1, name: 'Resilient Architecture', weight: 0.26 });
});

afterAll(() => {
	sqlite.close();
});

describe('importGeneratedQuestions', () => {
	it('imports valid generated questions with source=ai', async () => {
		const result = await importGeneratedQuestions([question]);
		expect(result.importedCount).toBe(1);
		expect(result.skippedCount).toBe(0);
		expect(result.importedIds).toHaveLength(1);

		const [row] = await testDb.select({ source: schema.questions.source }).from(schema.questions);
		expect(row.source).toBe('ai');

		const options = await testDb
			.select()
			.from(schema.questionOptions)
			.where(eq(schema.questionOptions.questionId, result.importedIds[0]));
		expect(options).toHaveLength(4);
	});

	it('skips duplicates on a second run', async () => {
		const result = await importGeneratedQuestions([question]);
		expect(result.importedCount).toBe(0);
		expect(result.skippedCount).toBe(1);
	});

	it('handles an empty list', async () => {
		const result = await importGeneratedQuestions([]);
		expect(result.importedCount).toBe(0);
		expect(result.importedIds).toEqual([]);
	});
});

import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '$lib/db/schema';
import type { GeneratedQuestion } from './provider';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('$lib/db/client', () => ({ db: testDb }));

let validateGeneratedQuestions: typeof import('./validator').validateGeneratedQuestions;
let findDuplicates: typeof import('./validator').findDuplicates;
let loadExistingQuestionTexts: typeof import('./validator').loadExistingQuestionTexts;

const now = new Date().toISOString();

function makeQuestion(overrides: Partial<GeneratedQuestion> = {}): GeneratedQuestion {
	return {
		question:
			'A company is migrating an application to AWS and needs highly durable storage for millions of user-generated images. Which solution should the solutions architect recommend?',
		type: 'single',
		difficulty: 'medium',
		domain: 'resilient_architecture',
		subcategory: 'storage',
		services: ['Amazon S3'],
		options: [
			{
				key: 'A',
				text: 'Use S3 Standard with lifecycle policies',
				correct: true,
				explanation: 'Meets durability and access requirements with minimal overhead.'
			},
			{
				key: 'B',
				text: 'Use Amazon EBS gp3 volumes',
				correct: false,
				explanation: 'Block storage requires managed instances and does not scale.'
			},
			{
				key: 'C',
				text: 'Use S3 Glacier Deep Archive',
				correct: false,
				explanation: 'Retrieval takes hours, violating immediate access.'
			},
			{
				key: 'D',
				text: 'Use Amazon EFS',
				correct: false,
				explanation: 'File storage is more expensive for this use case.'
			}
		],
		explanation:
			'S3 Standard with lifecycle policies provides the required durability and immediate access at the lowest cost.',
		keyConcept: 'Object storage',
		reference: 'AWS documentation',
		...overrides
	};
}

beforeAll(async () => {
	migrate(testDb, { migrationsFolder: 'drizzle' });

	const validator = await import('./validator');
	validateGeneratedQuestions = validator.validateGeneratedQuestions;
	findDuplicates = validator.findDuplicates;
	loadExistingQuestionTexts = validator.loadExistingQuestionTexts;

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

	await testDb.insert(schema.questions).values({
		examProfileId: 1,
		questionText:
			'A company is migrating an application to AWS and needs highly durable storage for millions of user-generated images. Which solution should the solutions architect recommend?',
		questionType: 'single',
		difficulty: 'medium',
		domainId: domain.id,
		explanation: 'Existing question explanation',
		source: 'import',
		createdAt: now,
		updatedAt: now
	});
});

afterAll(() => {
	sqlite.close();
});

describe('findDuplicates', () => {
	it('detects exact match with existing bank', async () => {
		const existing = await loadExistingQuestionTexts();
		const duplicates = findDuplicates([makeQuestion()], existing);
		expect(duplicates.size).toBe(1);
		expect(duplicates.get(0)).toContain('existing question');
	});

	it('detects duplicate within the batch', () => {
		const batch = [makeQuestion(), makeQuestion()];
		const duplicates = findDuplicates(batch, new Set());
		expect(duplicates.size).toBe(1);
		expect(duplicates.get(1)).toContain('generated question #1');
	});

	it('passes unique questions', () => {
		const batch = [
			makeQuestion(),
			makeQuestion({
				question:
					'A different company scenario about networking with VPC design requirements for a multi-tier application. Which solution?'
			})
		];
		const duplicates = findDuplicates(batch, new Set());
		expect(duplicates.size).toBe(0);
	});

	it('normalizes punctuation and case for comparison', () => {
		const batch = [
			makeQuestion(),
			makeQuestion({ question: makeQuestion().question.toUpperCase().replace(/\./g, '') })
		];
		const duplicates = findDuplicates(batch, new Set());
		expect(duplicates.size).toBe(1);
	});
});

describe('validateGeneratedQuestions', () => {
	it('accepts a fully valid question', async () => {
		const result = await validateGeneratedQuestions([
			makeQuestion({
				question:
					'A media startup is designing a video archive on AWS with rare access patterns and strict budget limits for its engineering team. Which solution?'
			})
		]);
		expect(result.valid).toHaveLength(1);
		expect(result.needReview).toHaveLength(0);
	});

	it('flags too-short question text', async () => {
		const result = await validateGeneratedQuestions([
			makeQuestion({ question: 'Short question?' })
		]);
		expect(result.valid).toHaveLength(0);
		expect(result.needReview[0].issues.some((i) => i.includes('too short'))).toBe(true);
	});

	it('flags unknown domain', async () => {
		const result = await validateGeneratedQuestions([
			makeQuestion({ domain: 'quantum_computing' })
		]);
		expect(result.needReview[0].issues.some((i) => i.includes('Unknown domain'))).toBe(true);
	});

	it('flags missing services', async () => {
		const result = await validateGeneratedQuestions([makeQuestion({ services: [] })]);
		expect(result.needReview[0].issues.some((i) => i.includes('No AWS services'))).toBe(true);
	});

	it('flags short explanation', async () => {
		const result = await validateGeneratedQuestions([makeQuestion({ explanation: 'Too short.' })]);
		expect(result.needReview[0].issues.some((i) => i.includes('Explanation is too short'))).toBe(
			true
		);
	});

	it('flags duplicate against existing bank', async () => {
		const result = await validateGeneratedQuestions([makeQuestion()]);
		expect(result.needReview).toHaveLength(1);
		expect(result.needReview[0].issues.some((i) => i.includes('existing question'))).toBe(true);
	});

	it('separates valid from need-review in a mixed batch', async () => {
		const result = await validateGeneratedQuestions([
			makeQuestion({
				question:
					'A fintech company is designing a transaction ledger on AWS with strict compliance and audit requirements for its platform team. Which solution?'
			}),
			makeQuestion({ question: 'Short?' })
		]);
		expect(result.valid).toHaveLength(1);
		expect(result.needReview).toHaveLength(1);
		expect(result.allIssues.length).toBeGreaterThan(0);
	});
});

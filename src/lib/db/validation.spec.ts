import { describe, expect, it } from 'vitest';
import { importQuestionSchema, validateQuestion, normalizeQuestionText } from './validation';

describe('normalizeQuestionText', () => {
	it('lowercases and strips punctuation', () => {
		expect(normalizeQuestionText('Hello, World!  AWS.')).toBe('hello world aws');
	});

	it('collapses whitespace', () => {
		expect(normalizeQuestionText('a   b\n\tc')).toBe('a b c');
	});
});

const baseQuestion = {
	questionText: 'A company needs to store data.',
	questionType: 'single',
	difficulty: 'medium',
	domain: 'resilient_architecture',
	services: ['Amazon S3'],
	options: [
		{ key: 'A', text: 'Option A', correct: false },
		{ key: 'B', text: 'Option B', correct: true },
		{ key: 'C', text: 'Option C', correct: false },
		{ key: 'D', text: 'Option D', correct: false }
	],
	explanation: 'B is correct because...'
};

describe('importQuestionSchema', () => {
	it('accepts a valid single choice question', () => {
		const result = importQuestionSchema.safeParse(baseQuestion);
		expect(result.success).toBe(true);
	});

	it('rejects a question without questionText', () => {
		const result = importQuestionSchema.safeParse({ ...baseQuestion, questionText: '' });
		expect(result.success).toBe(false);
	});

	it('rejects invalid question type', () => {
		const result = importQuestionSchema.safeParse({ ...baseQuestion, questionType: 'essay' });
		expect(result.success).toBe(false);
	});

	it('rejects fewer than 4 options', () => {
		const result = importQuestionSchema.safeParse({
			...baseQuestion,
			options: baseQuestion.options.slice(0, 3)
		});
		expect(result.success).toBe(false);
	});

	it('rejects missing explanation', () => {
		const result = importQuestionSchema.safeParse({ ...baseQuestion, explanation: '' });
		expect(result.success).toBe(false);
	});
});

describe('validateQuestion', () => {
	it('passes for valid single choice', () => {
		const parsed = importQuestionSchema.parse(baseQuestion);
		expect(validateQuestion(parsed)).toEqual([]);
	});

	it('fails when single choice has multiple correct answers', () => {
		const q = {
			...baseQuestion,
			options: baseQuestion.options.map((o, i) => ({ ...o, correct: i < 2 }))
		};
		const parsed = importQuestionSchema.parse(q);
		const errors = validateQuestion(parsed);
		expect(errors).toContain('single choice must have exactly 1 correct answer');
	});

	it('fails when multiple response has fewer than 2 correct answers', () => {
		const q = { ...baseQuestion, questionType: 'multiple' as const };
		const parsed = importQuestionSchema.parse(q);
		const errors = validateQuestion(parsed);
		expect(errors).toContain('multiple response must have at least 2 correct answers');
	});

	it('passes for valid multiple response', () => {
		const q = {
			...baseQuestion,
			questionType: 'multiple' as const,
			options: [
				{ key: 'A', text: 'A', correct: true },
				{ key: 'B', text: 'B', correct: false },
				{ key: 'C', text: 'C', correct: true },
				{ key: 'D', text: 'D', correct: false }
			]
		};
		const parsed = importQuestionSchema.parse(q);
		expect(validateQuestion(parsed)).toEqual([]);
	});

	it('fails when option keys are duplicated', () => {
		const q = {
			...baseQuestion,
			options: baseQuestion.options.map((o) => ({ ...o, key: 'A' }))
		};
		const parsed = importQuestionSchema.parse(q);
		const errors = validateQuestion(parsed);
		expect(errors).toContain('option keys must be unique');
	});
});

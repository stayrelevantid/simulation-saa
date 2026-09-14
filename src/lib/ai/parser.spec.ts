import { describe, expect, it } from 'vitest';
import { buildSystemPrompt, buildUserPrompt } from './prompts/saa-c03';
import { extractJsonArray, parseQuestionsResponse, AIParseError } from './parser';
import type { GenerationRequestConfig } from './provider';

const config: GenerationRequestConfig = {
	examProfile: 'SAA-C03',
	questionCount: 5,
	difficulty: ['medium', 'hard'],
	questionTypes: ['single', 'multiple'],
	domains: ['Resilient Architecture'],
	awsServices: ['Amazon S3']
};

describe('buildSystemPrompt', () => {
	it('includes strict originality rules', () => {
		const prompt = buildSystemPrompt(config);
		expect(prompt).toContain('original');
		expect(prompt).toContain('Never reproduce');
		expect(prompt).toContain('actual AWS exam questions');
	});

	it('includes exam profile', () => {
		expect(buildSystemPrompt(config)).toContain('SAA-C03');
	});

	it('requires strict JSON output', () => {
		expect(buildSystemPrompt(config)).toContain('STRICT JSON');
	});

	it('defines correct answer count rules', () => {
		const prompt = buildSystemPrompt(config);
		expect(prompt).toContain('exactly 1 correct option');
		expect(prompt).toContain('2 or more correct options');
	});
});

describe('buildUserPrompt', () => {
	it('includes question count, difficulty, types, and domains', () => {
		const prompt = buildUserPrompt(config);
		expect(prompt).toContain('Generate 5 original SAA-C03 practice questions');
		expect(prompt).toContain('medium, hard');
		expect(prompt).toContain('single choice');
		expect(prompt).toContain('multiple response');
		expect(prompt).toContain('Resilient Architecture');
		expect(prompt).toContain('Amazon S3');
	});

	it('uses auto service selection when none specified', () => {
		const prompt = buildUserPrompt({ ...config, awsServices: undefined });
		expect(prompt).toContain('choose the most relevant services');
	});
});

const validQuestion = {
	question: 'A company is migrating... Which solution should the solutions architect recommend?',
	type: 'single',
	difficulty: 'medium',
	domain: 'resilient_architecture',
	subcategory: 'storage',
	services: ['Amazon S3'],
	options: [
		{ key: 'A', text: 'Option A', correct: false, explanation: 'wrong because...' },
		{ key: 'B', text: 'Option B', correct: true, explanation: 'right because...' },
		{ key: 'C', text: 'Option C', correct: false, explanation: 'wrong because...' },
		{ key: 'D', text: 'Option D', correct: false, explanation: 'wrong because...' }
	],
	explanation: 'Overall explanation',
	keyConcept: 'Object storage',
	reference: 'AWS documentation'
};

describe('extractJsonArray', () => {
	it('parses plain JSON array', () => {
		const result = extractJsonArray(JSON.stringify([validQuestion]));
		expect(result).toHaveLength(1);
	});

	it('parses JSON inside markdown code fences', () => {
		const content = '```json\n' + JSON.stringify([validQuestion]) + '\n```';
		const result = extractJsonArray(content);
		expect(result).toHaveLength(1);
	});

	it('parses JSON with surrounding commentary', () => {
		const content = 'Here are the questions:\n' + JSON.stringify([validQuestion]) + '\nDone.';
		const result = extractJsonArray(content);
		expect(result).toHaveLength(1);
	});

	it('throws when no array found', () => {
		expect(() => extractJsonArray('no json here')).toThrow(AIParseError);
	});

	it('throws on invalid JSON', () => {
		expect(() => extractJsonArray('[{broken')).toThrow(AIParseError);
	});
});

describe('parseQuestionsResponse', () => {
	it('parses a valid single choice question', () => {
		const questions = parseQuestionsResponse(JSON.stringify([validQuestion]));
		expect(questions).toHaveLength(1);
		expect(questions[0].type).toBe('single');
		expect(questions[0].options).toHaveLength(4);
		expect(questions[0].keyConcept).toBe('Object storage');
	});

	it('parses valid multiple response question', () => {
		const multiple = {
			...validQuestion,
			type: 'multiple',
			options: [
				{ key: 'A', text: 'A', correct: true, explanation: '...' },
				{ key: 'B', text: 'B', correct: false, explanation: '...' },
				{ key: 'C', text: 'C', correct: true, explanation: '...' },
				{ key: 'D', text: 'D', correct: false, explanation: '...' }
			]
		};
		const questions = parseQuestionsResponse(JSON.stringify([multiple]));
		expect(questions[0].type).toBe('multiple');
	});

	it('rejects single choice with 2 correct answers', () => {
		const bad = {
			...validQuestion,
			options: validQuestion.options.map((o, i) => ({ ...o, correct: i < 2 }))
		};
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/exactly 1 correct/);
	});

	it('rejects multiple response with 1 correct answer', () => {
		const bad = { ...validQuestion, type: 'multiple' };
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/at least 2 correct/);
	});

	it('rejects fewer than 4 options', () => {
		const bad = { ...validQuestion, options: validQuestion.options.slice(0, 3) };
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/4-5 options/);
	});

	it('rejects duplicate option keys', () => {
		const bad = {
			...validQuestion,
			options: validQuestion.options.map((o) => ({ ...o, key: 'A' }))
		};
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/duplicate option keys/);
	});

	it('rejects missing explanation', () => {
		const bad = { ...validQuestion, explanation: '' };
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/explanation/);
	});

	it('rejects invalid difficulty', () => {
		const bad = { ...validQuestion, difficulty: 'impossible' };
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/invalid difficulty/);
	});

	it('rejects option missing explanation', () => {
		const bad = {
			...validQuestion,
			options: validQuestion.options.map((o) => ({ ...o, explanation: undefined }))
		};
		expect(() => parseQuestionsResponse(JSON.stringify([bad]))).toThrow(/missing explanation/);
	});
});

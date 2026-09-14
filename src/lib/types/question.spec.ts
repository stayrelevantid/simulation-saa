import { describe, expect, it } from 'vitest';
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS } from './question';

describe('QUESTION_TYPE_LABELS', () => {
	it('labels single as Single Choice', () => {
		expect(QUESTION_TYPE_LABELS.single).toBe('Single Choice');
	});

	it('labels multiple as Multiple Response', () => {
		expect(QUESTION_TYPE_LABELS.multiple).toBe('Multiple Response');
	});

	it('does not use Multiple Choice label for single', () => {
		expect(QUESTION_TYPE_LABELS.single).not.toBe('Multiple Choice');
	});
});

describe('DIFFICULTY_LABELS', () => {
	it('labels all difficulty levels', () => {
		expect(DIFFICULTY_LABELS.easy).toBe('Easy');
		expect(DIFFICULTY_LABELS.medium).toBe('Medium');
		expect(DIFFICULTY_LABELS.hard).toBe('Hard');
	});
});

describe('SOURCE_LABELS', () => {
	it('labels all sources', () => {
		expect(SOURCE_LABELS.manual).toBe('Manual');
		expect(SOURCE_LABELS.ai).toBe('AI');
		expect(SOURCE_LABELS.import).toBe('Import');
	});
});

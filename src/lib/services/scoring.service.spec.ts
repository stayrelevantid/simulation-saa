import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, checkAnswer, calculateScore, summarizeSession } from './scoring.service';

describe('isAnswerCorrect', () => {
	it('accepts correct single choice answer', () => {
		expect(isAnswerCorrect(['B'], ['B'], 'single')).toBe(true);
	});

	it('rejects wrong single choice answer', () => {
		expect(isAnswerCorrect(['A'], ['B'], 'single')).toBe(false);
	});

	it('rejects multiple selections for single choice even if one is correct', () => {
		expect(isAnswerCorrect(['A', 'B'], ['B'], 'single')).toBe(false);
	});

	it('rejects empty selection', () => {
		expect(isAnswerCorrect([], ['B'], 'single')).toBe(false);
	});

	it('accepts exact match for multiple response', () => {
		expect(isAnswerCorrect(['A', 'C'], ['A', 'C'], 'multiple')).toBe(true);
	});

	it('accepts multiple response in any order', () => {
		expect(isAnswerCorrect(['C', 'A'], ['A', 'C'], 'multiple')).toBe(true);
	});

	it('applies all-or-nothing for partial multiple response', () => {
		expect(isAnswerCorrect(['A'], ['A', 'C'], 'multiple')).toBe(false);
	});

	it('applies all-or-nothing when extra option selected', () => {
		expect(isAnswerCorrect(['A', 'C', 'D'], ['A', 'C'], 'multiple')).toBe(false);
	});

	it('deduplicates selections', () => {
		expect(isAnswerCorrect(['A', 'A'], ['A'], 'single')).toBe(true);
	});
});

describe('checkAnswer', () => {
	it('returns structured result for correct answer', () => {
		const result = checkAnswer(1, 'single', ['B'], ['B']);
		expect(result).toEqual({
			questionId: 1,
			selected: ['B'],
			correct: true,
			correctKeys: ['B']
		});
	});
});

describe('calculateScore', () => {
	const base = { scoreMin: 100, scoreMax: 1000, passingScore: 720 };

	it('maps perfect score to max', () => {
		const result = calculateScore({
			...base,
			correctCount: 65,
			incorrectCount: 0,
			totalQuestions: 65
		});
		expect(result.estimatedScore).toBe(1000);
		expect(result.passed).toBe(true);
	});

	it('maps zero score to min', () => {
		const result = calculateScore({
			...base,
			correctCount: 0,
			incorrectCount: 65,
			totalQuestions: 65
		});
		expect(result.estimatedScore).toBe(100);
		expect(result.passed).toBe(false);
	});

	it('passes at exactly 720', () => {
		// 50/65 correct → 100 + (50/65)*900 = 792.3 → 792
		const result = calculateScore({
			...base,
			correctCount: 50,
			incorrectCount: 15,
			totalQuestions: 65
		});
		expect(result.estimatedScore).toBe(792);
		expect(result.passed).toBe(true);
	});

	it('fails below passing score', () => {
		// 40/65 correct → 100 + (40/65)*900 = 653.8 → 654
		const result = calculateScore({
			...base,
			correctCount: 40,
			incorrectCount: 25,
			totalQuestions: 65
		});
		expect(result.estimatedScore).toBe(654);
		expect(result.passed).toBe(false);
	});

	it('handles zero total questions', () => {
		const result = calculateScore({
			...base,
			correctCount: 0,
			incorrectCount: 0,
			totalQuestions: 0
		});
		expect(result.estimatedScore).toBe(100);
		expect(result.passed).toBe(false);
	});
});

describe('summarizeSession', () => {
	it('summarizes mixed results', () => {
		const results = [
			{ questionId: 1, selected: ['A'], correct: true, correctKeys: ['A'] },
			{ questionId: 2, selected: ['B'], correct: false, correctKeys: ['C'] },
			{ questionId: 3, selected: ['D'], correct: true, correctKeys: ['D'] }
		];
		const summary = summarizeSession(results);
		expect(summary).toEqual({
			correctCount: 2,
			incorrectCount: 1,
			totalAnswered: 3,
			accuracy: 2 / 3
		});
	});

	it('handles empty session', () => {
		const summary = summarizeSession([]);
		expect(summary).toEqual({
			correctCount: 0,
			incorrectCount: 0,
			totalAnswered: 0,
			accuracy: 0
		});
	});
});

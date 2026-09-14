import type { QuestionType, Difficulty } from '$lib/types/question';

export interface CorrectAnswerMap {
	[questionId: number]: string[];
}

export interface AnswerResult {
	questionId: number;
	selected: string[];
	correct: boolean;
	correctKeys: string[];
}

export function isAnswerCorrect(
	selected: string[],
	correctKeys: string[],
	questionType: QuestionType
): boolean {
	const normalizedSelected = [...new Set(selected)].sort();
	const normalizedCorrect = [...new Set(correctKeys)].sort();

	if (questionType === 'multiple') {
		return (
			normalizedSelected.length === normalizedCorrect.length &&
			normalizedSelected.every((key, i) => key === normalizedCorrect[i])
		);
	}

	return normalizedSelected.length === 1 && normalizedSelected[0] === normalizedCorrect[0];
}

export function checkAnswer(
	questionId: number,
	questionType: QuestionType,
	selected: string[],
	correctKeys: string[]
): AnswerResult {
	return {
		questionId,
		selected,
		correct: isAnswerCorrect(selected, correctKeys, questionType),
		correctKeys
	};
}

export interface ScoreInput {
	correctCount: number;
	incorrectCount: number;
	totalQuestions: number;
	scoreMin: number;
	scoreMax: number;
	passingScore: number;
}

export interface ScoreResult {
	estimatedScore: number;
	passed: boolean;
	percentage: number;
}

export function calculateScore(input: ScoreInput): ScoreResult {
	const { correctCount, totalQuestions, scoreMin, scoreMax, passingScore } = input;

	const percentage = totalQuestions > 0 ? correctCount / totalQuestions : 0;
	const estimatedScore = Math.round(scoreMin + percentage * (scoreMax - scoreMin));

	return {
		estimatedScore,
		passed: estimatedScore >= passingScore,
		percentage
	};
}

export interface SessionSummary {
	correctCount: number;
	incorrectCount: number;
	totalAnswered: number;
	accuracy: number;
}

export function summarizeSession(results: AnswerResult[]): SessionSummary {
	const correctCount = results.filter((r) => r.correct).length;
	const incorrectCount = results.length - correctCount;
	const totalAnswered = results.length;

	return {
		correctCount,
		incorrectCount,
		totalAnswered,
		accuracy: totalAnswered > 0 ? correctCount / totalAnswered : 0
	};
}

export type { QuestionType, Difficulty };

export type QuestionType = 'single' | 'multiple';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionSource = 'manual' | 'ai' | 'import';

export interface QuestionListItem {
	id: number;
	questionText: string;
	questionType: QuestionType;
	difficulty: Difficulty;
	domainName: string;
	subcategory: string | null;
	source: QuestionSource;
	services: string[];
	bookmarked: boolean;
}

export interface QuestionOptionView {
	id: number;
	optionKey: string;
	optionText: string;
	isCorrect: boolean;
	explanation: string | null;
}

export interface QuestionDetail extends QuestionListItem {
	examProfileId: number;
	explanation: string;
	keyConcept: string | null;
	reference: string | null;
	options: QuestionOptionView[];
	createdAt: string;
	updatedAt: string;
}

export interface QuestionFilters {
	domainId?: number;
	difficulty?: Difficulty;
	questionType?: QuestionType;
	service?: string;
	tag?: string;
	search?: string;
	bookmarkedOnly?: boolean;
	limit?: number;
	offset?: number;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
	single: 'Single Choice',
	multiple: 'Multiple Response'
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
	easy: 'Easy',
	medium: 'Medium',
	hard: 'Hard'
};

export const SOURCE_LABELS: Record<QuestionSource, string> = {
	manual: 'Manual',
	ai: 'AI',
	import: 'Import'
};

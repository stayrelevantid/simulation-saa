import type { Difficulty, QuestionType } from '$lib/types/question';

export interface AIModel {
	id: string;
	name?: string;
}

export interface GenerationRequestConfig {
	examProfile: string;
	questionCount: number;
	difficulty: Difficulty[];
	questionTypes: QuestionType[];
	domains: string[];
	subcategory?: string;
	awsServices?: string[];
	scenarioStyle?: string;
}

export interface GeneratedOption {
	key: string;
	text: string;
	correct: boolean;
	explanation: string;
}

export interface GeneratedQuestion {
	question: string;
	type: QuestionType;
	difficulty: Difficulty;
	domain: string;
	subcategory?: string;
	services: string[];
	options: GeneratedOption[];
	explanation: string;
	keyConcept?: string;
	reference?: string;
}

export interface AIGenerationResult {
	questions: GeneratedQuestion[];
	model: string;
}

export interface AIProvider {
	listModels(): Promise<AIModel[]>;
	generateQuestions(config: GenerationRequestConfig, model: string): Promise<AIGenerationResult>;
}

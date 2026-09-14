import type { GeneratedQuestion } from '$lib/ai/provider';
import type { Difficulty, QuestionType } from '$lib/types/question';

export class AIParseError extends Error {
	constructor(
		message: string,
		public readonly rawPreview?: string
	) {
		super(message);
		this.name = 'AIParseError';
	}
}

export function extractJsonArray(content: string): unknown[] {
	const trimmed = content.trim();

	const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
	const candidate = fenced ? fenced[1].trim() : trimmed;

	const start = candidate.indexOf('[');
	const end = candidate.lastIndexOf(']');
	if (start === -1 || end === -1 || end <= start) {
		throw new AIParseError('No JSON array found in AI response.', candidate.slice(0, 200));
	}

	const jsonSlice = candidate.slice(start, end + 1);

	try {
		const parsed = JSON.parse(jsonSlice);
		if (!Array.isArray(parsed)) {
			throw new AIParseError('AI response is not a JSON array.', jsonSlice.slice(0, 200));
		}
		return parsed;
	} catch (err) {
		if (err instanceof AIParseError) throw err;
		throw new AIParseError('AI response contains invalid JSON.', jsonSlice.slice(0, 200));
	}
}

export function parseQuestionsResponse(content: string): GeneratedQuestion[] {
	const items = extractJsonArray(content);

	return items.map((item, index) => {
		if (typeof item !== 'object' || item === null) {
			throw new AIParseError(`Question ${index + 1} is not an object.`);
		}
		const q = item as Record<string, unknown>;

		const question = q.question;
		if (typeof question !== 'string' || question.trim().length === 0) {
			throw new AIParseError(`Question ${index + 1}: missing or empty "question" field.`);
		}

		const type = q.type;
		if (type !== 'single' && type !== 'multiple') {
			throw new AIParseError(`Question ${index + 1}: invalid question type "${String(type)}".`);
		}

		const difficulty = q.difficulty;
		if (difficulty !== 'easy' && difficulty !== 'medium' && difficulty !== 'hard') {
			throw new AIParseError(`Question ${index + 1}: invalid difficulty "${String(difficulty)}".`);
		}

		const domain = q.domain;
		if (typeof domain !== 'string' || domain.trim().length === 0) {
			throw new AIParseError(`Question ${index + 1}: missing or empty "domain" field.`);
		}

		const explanation = q.explanation;
		if (typeof explanation !== 'string' || explanation.trim().length === 0) {
			throw new AIParseError(`Question ${index + 1}: missing or empty "explanation" field.`);
		}

		const rawOptions = q.options;
		if (!Array.isArray(rawOptions) || rawOptions.length < 4 || rawOptions.length > 5) {
			throw new AIParseError(`Question ${index + 1}: must have 4-5 options.`);
		}

		const options = rawOptions.map((opt, optIndex) => {
			if (typeof opt !== 'object' || opt === null) {
				throw new AIParseError(`Question ${index + 1} option ${optIndex + 1} is not an object.`);
			}
			const o = opt as Record<string, unknown>;

			const key = o.key;
			if (typeof key !== 'string' || key.length !== 1) {
				throw new AIParseError(`Question ${index + 1} option ${optIndex + 1}: invalid key.`);
			}

			const text = o.text;
			if (typeof text !== 'string' || text.trim().length === 0) {
				throw new AIParseError(`Question ${index + 1} option ${key}: missing or empty text.`);
			}

			const correct = o.correct;
			if (typeof correct !== 'boolean') {
				throw new AIParseError(`Question ${index + 1} option ${key}: "correct" must be a boolean.`);
			}

			const optExplanation = o.explanation;
			if (typeof optExplanation !== 'string' || optExplanation.trim().length === 0) {
				throw new AIParseError(`Question ${index + 1} option ${key}: missing explanation.`);
			}

			return { key, text, correct, explanation: optExplanation };
		});

		const keys = options.map((o) => o.key);
		if (new Set(keys).size !== keys.length) {
			throw new AIParseError(`Question ${index + 1}: duplicate option keys.`);
		}

		const correctCount = options.filter((o) => o.correct).length;
		if (type === 'single' && correctCount !== 1) {
			throw new AIParseError(
				`Question ${index + 1}: single choice must have exactly 1 correct answer (found ${correctCount}).`
			);
		}
		if (type === 'multiple' && correctCount < 2) {
			throw new AIParseError(
				`Question ${index + 1}: multiple response must have at least 2 correct answers (found ${correctCount}).`
			);
		}

		const services = Array.isArray(q.services)
			? q.services.filter((s): s is string => typeof s === 'string')
			: [];

		return {
			question,
			type: type as QuestionType,
			difficulty: difficulty as Difficulty,
			domain,
			subcategory: typeof q.subcategory === 'string' ? q.subcategory : undefined,
			services,
			options,
			explanation,
			keyConcept: typeof q.keyConcept === 'string' ? q.keyConcept : undefined,
			reference: typeof q.reference === 'string' ? q.reference : undefined
		};
	});
}

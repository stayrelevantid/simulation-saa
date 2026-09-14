import { z } from 'zod';

export const importQuestionSchema = z.object({
	questionText: z.string().min(1, 'questionText is required'),
	questionType: z.enum(['single', 'multiple']),
	difficulty: z.enum(['easy', 'medium', 'hard']),
	domain: z.string().min(1, 'domain is required'),
	subcategory: z.string().optional(),
	services: z.array(z.string()).default([]),
	options: z
		.array(
			z.object({
				key: z.string().min(1),
				text: z.string().min(1),
				correct: z.boolean(),
				explanation: z.string().optional()
			})
		)
		.min(4)
		.max(5),
	explanation: z.string().min(1, 'explanation is required'),
	keyConcept: z.string().optional(),
	reference: z.string().optional()
});

export type ImportQuestion = z.infer<typeof importQuestionSchema>;

export function normalizeQuestionText(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

export function validateQuestion(q: ImportQuestion): string[] {
	const errors: string[] = [];
	const correctCount = q.options.filter((o) => o.correct).length;

	if (q.questionType === 'single' && correctCount !== 1) {
		errors.push('single choice must have exactly 1 correct answer');
	}
	if (q.questionType === 'multiple' && correctCount < 2) {
		errors.push('multiple response must have at least 2 correct answers');
	}

	const keys = q.options.map((o) => o.key);
	if (new Set(keys).size !== keys.length) {
		errors.push('option keys must be unique');
	}

	return errors;
}

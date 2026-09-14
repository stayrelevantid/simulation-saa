import type { RequestHandler } from './$types';
import { generateQuestions } from '$lib/ai/generator';
import { OpenCodeProviderError } from '$lib/ai/opencode';
import { AIParseError } from '$lib/ai/parser';
import { listDomains } from '$lib/repositories/question.repository';
import { json } from '@sveltejs/kit';
import type { Difficulty, QuestionType } from '$lib/types/question';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { model, questionCount, difficulty, questionTypes, domains, awsServices, scenarioStyle } =
		body as {
			model?: string;
			questionCount?: number;
			difficulty?: Difficulty[];
			questionTypes?: QuestionType[];
			domains?: string[];
			awsServices?: string[];
			scenarioStyle?: string;
		};

	if (!model || typeof model !== 'string') {
		return json({ error: 'Model is required' }, { status: 400 });
	}
	if (!questionCount || questionCount < 1 || questionCount > 50) {
		return json({ error: 'Question count must be between 1 and 50' }, { status: 400 });
	}
	if (!Array.isArray(difficulty) || difficulty.length === 0) {
		return json({ error: 'Select at least one difficulty' }, { status: 400 });
	}
	if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
		return json({ error: 'Select at least one question type' }, { status: 400 });
	}
	if (!Array.isArray(domains) || domains.length === 0) {
		return json({ error: 'Select at least one domain' }, { status: 400 });
	}

	const domainRows = await listDomains();
	const slugToName = new Map(
		domainRows.map((d) => [d.name.toLowerCase().replace(/[^a-z]+/g, '_'), d.name])
	);

	const config = {
		examProfile: 'SAA-C03',
		questionCount,
		difficulty,
		questionTypes,
		domains: domains.map((slug) => slugToName.get(slug) ?? slug),
		awsServices: Array.isArray(awsServices) && awsServices.length > 0 ? awsServices : undefined,
		scenarioStyle: typeof scenarioStyle === 'string' ? scenarioStyle : undefined
	};

	try {
		const result = await generateQuestions(config, model);
		return json({ questions: result.questions, model: result.model });
	} catch (err) {
		if (err instanceof OpenCodeProviderError) {
			return json({ error: err.message }, { status: 502 });
		}
		if (err instanceof AIParseError) {
			return json(
				{ error: `AI response validation failed: ${err.message}`, rawPreview: err.rawPreview },
				{ status: 422 }
			);
		}
		return json({ error: 'AI generation failed' }, { status: 500 });
	}
};

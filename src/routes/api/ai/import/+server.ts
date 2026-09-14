import type { RequestHandler } from './$types';
import { importGeneratedQuestions } from '$lib/ai/import-questions';
import { json } from '@sveltejs/kit';
import type { GeneratedQuestion } from '$lib/ai/provider';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { questions: candidates } = body as { questions?: GeneratedQuestion[] };

	if (!Array.isArray(candidates) || candidates.length === 0) {
		return json({ error: 'No questions to import' }, { status: 400 });
	}

	const result = await importGeneratedQuestions(candidates);
	return json(result);
};

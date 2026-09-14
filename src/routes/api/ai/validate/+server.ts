import type { RequestHandler } from './$types';
import { validateGeneratedQuestions } from '$lib/ai/validator';
import { json } from '@sveltejs/kit';
import type { GeneratedQuestion } from '$lib/ai/provider';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { questions } = body as { questions?: GeneratedQuestion[] };

	if (!Array.isArray(questions) || questions.length === 0) {
		return json({ error: 'No questions to validate' }, { status: 400 });
	}

	const result = await validateGeneratedQuestions(questions);

	return json({
		validCount: result.valid.length,
		needReviewCount: result.needReview.length,
		issues: result.allIssues,
		// valid questions returned for the approval step
		validQuestions: result.valid
	});
};

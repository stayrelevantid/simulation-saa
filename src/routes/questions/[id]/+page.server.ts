import type { PageServerLoad, Actions } from './$types';
import { getQuestion, toggleBookmark } from '$lib/repositories/question.repository';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const question = await getQuestion(Number(params.id));
	if (!question) throw error(404, 'Question not found');
	return { question };
};

export const actions: Actions = {
	toggleBookmark: async ({ params }) => {
		const questionId = Number(params.id);
		if (!questionId || Number.isNaN(questionId)) {
			return fail(400, { error: 'Invalid question ID' });
		}
		const bookmarked = await toggleBookmark(questionId);
		return { bookmarked };
	}
};

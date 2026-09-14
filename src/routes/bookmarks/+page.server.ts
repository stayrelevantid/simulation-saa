import type { PageServerLoad, Actions } from './$types';
import { listBookmarkedQuestions, toggleBookmark } from '$lib/repositories/question.repository';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return { questions: await listBookmarkedQuestions() };
};

export const actions: Actions = {
	toggleBookmark: async ({ request }) => {
		const formData = await request.formData();
		const questionId = Number(formData.get('questionId'));
		if (!questionId || Number.isNaN(questionId)) {
			return fail(400, { error: 'Invalid question ID' });
		}
		await toggleBookmark(questionId);
		return { success: true };
	}
};

import type { PageServerLoad } from './$types';
import { getSessionReview } from '$lib/repositories/review.repository';
import { getSessionById } from '$lib/services/exam.service';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = Number(params.sessionId);
	if (Number.isNaN(sessionId)) throw error(400, 'Invalid session ID');

	const session = await getSessionById(sessionId);
	if (!session) throw error(404, 'Exam session not found');
	if (session.status === 'active') throw error(400, 'Exam still in progress');

	const questions = await getSessionReview(sessionId);

	return {
		sessionId,
		questions,
		counts: {
			all: questions.length,
			correct: questions.filter((q) => q.isCorrect).length,
			incorrect: questions.filter((q) => !q.isCorrect).length,
			flagged: questions.filter((q) => q.flagged).length
		}
	};
};

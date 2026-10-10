import type { PageServerLoad, Actions } from './$types';
import {
	getActivePracticeSession,
	getPracticeSession,
	getPracticeSessionResume,
	markPracticeSessionCompleted
} from '$lib/services/question.service';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const rawSessionId = url.searchParams.get('sessionId');
	const session = rawSessionId
		? await getPracticeSession(Number(rawSessionId))
		: await getActivePracticeSession();

	if (!session) throw redirect(303, '/practice');
	if (!session.mode.startsWith('practice_')) throw error(404, 'Practice session not found');
	if (session.status === 'abandoned') throw redirect(303, '/practice');

	const resume = await getPracticeSessionResume(session.id);
	if (!resume || resume.questions.length === 0) throw redirect(303, '/practice');
	if (resume.finished && session.status === 'active') {
		await markPracticeSessionCompleted(session.id);
	}

	return {
		sessionId: session.id,
		mode: session.mode === 'practice_wrong' ? 'wrong' : 'practice',
		questions: resume.questions,
		answers: resume.answers,
		finished: resume.finished
	};
};

export const actions: Actions = {
	complete: async ({ request }) => {
		const formData = await request.formData();
		const sessionId = Number(formData.get('sessionId'));
		if (!Number.isInteger(sessionId) || sessionId <= 0) {
			return fail(400, { error: 'Invalid practice session.' });
		}
		await markPracticeSessionCompleted(sessionId);
		return { completed: true };
	}
};

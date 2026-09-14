import type { PageServerLoad } from './$types';
import { db } from '$lib/db/client';
import { examProfiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionById } from '$lib/services/exam.service';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = Number(params.sessionId);
	if (Number.isNaN(sessionId)) throw error(400, 'Invalid session ID');

	const session = await getSessionById(sessionId);
	if (!session) throw error(404, 'Exam session not found');

	if (session.status === 'active') {
		throw error(400, 'Exam still in progress');
	}

	const [profile] = await db
		.select()
		.from(examProfiles)
		.where(eq(examProfiles.id, session.examProfileId));

	const startedAt = new Date(session.startedAt).getTime();
	const completedAt = session.completedAt ? new Date(session.completedAt).getTime() : startedAt;
	const timeUsedMinutes = Math.round((completedAt - startedAt) / 60000);

	return {
		session: {
			id: session.id,
			score: session.score,
			correctCount: session.correctCount,
			incorrectCount: session.incorrectCount,
			status: session.status,
			timeUsedMinutes
		},
		profile: profile
			? {
					code: profile.code,
					name: profile.name,
					passingScore: profile.passingScore,
					scoreMax: profile.scoreMax,
					questionCount: profile.questionCount
				}
			: null
	};
};

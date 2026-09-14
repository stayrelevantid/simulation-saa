import type { PageServerLoad } from './$types';
import { db } from '$lib/db/client';
import { examProfiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSessionById } from '$lib/services/exam.service';
import { getSessionReview } from '$lib/repositories/review.repository';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const sessionId = Number(params.sessionId);
	if (Number.isNaN(sessionId)) throw error(400, 'Invalid session ID');

	const session = await getSessionById(sessionId);
	if (!session) throw error(404, 'Exam session not found');

	if (session.status === 'active') {
		throw error(400, 'Exam still in progress');
	}

	const [profile, questions] = await Promise.all([
		db.select().from(examProfiles).where(eq(examProfiles.id, session.examProfileId)),
		getSessionReview(sessionId)
	]);

	const startedAt = new Date(session.startedAt).getTime();
	const completedAt = session.completedAt ? new Date(session.completedAt).getTime() : startedAt;
	const timeUsedMinutes = Math.round((completedAt - startedAt) / 60000);

	return {
		sessionId,
		session: {
			id: session.id,
			score: session.score,
			correctCount: session.correctCount,
			incorrectCount: session.incorrectCount,
			status: session.status,
			timeUsedMinutes
		},
		profile: profile[0]
			? {
					code: profile[0].code,
					name: profile[0].name,
					passingScore: profile[0].passingScore,
					scoreMax: profile[0].scoreMax,
					questionCount: profile[0].questionCount
				}
			: null,
		questions,
		counts: {
			all: questions.length,
			correct: questions.filter((q) => q.isCorrect).length,
			incorrect: questions.filter((q) => !q.isCorrect).length,
			flagged: questions.filter((q) => q.flagged).length
		}
	};
};

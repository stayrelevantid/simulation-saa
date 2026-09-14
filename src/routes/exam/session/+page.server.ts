import type { PageServerLoad } from './$types';
import { db } from '$lib/db/client';
import { examProfiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import {
	getActiveExamSession,
	getRemainingSeconds,
	selectExamQuestions,
	saveExamAnswer,
	startExamSession
} from '$lib/services/exam.service';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
	if (!profile) throw error(404, 'SAA-C03 profile not found');

	let session = await getActiveExamSession('SAA-C03');

	if (!session) {
		const selectedQuestions = await selectExamQuestions(profile.id, profile.questionCount);
		if (selectedQuestions.length < profile.questionCount) {
			throw error(
				400,
				`Not enough questions (${selectedQuestions.length}/${profile.questionCount}). Import more questions first.`
			);
		}
		const sessionId = await startExamSession(profile.id, profile.durationMinutes);
		for (const q of selectedQuestions) {
			await saveExamAnswer(sessionId, q.id, [], false, null);
		}
		session = await getActiveExamSession('SAA-C03');
		if (!session) throw error(500, 'Failed to create exam session');
	}

	const remainingSeconds = await getRemainingSeconds(session.id);
	if (remainingSeconds <= 0) {
		throw redirect(303, `/results/${session.id}`);
	}

	return {
		sessionId: session.id,
		remainingSeconds
	};
};

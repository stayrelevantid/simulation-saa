import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/db/client';
import { examProfiles, examSessions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import {
	getActiveExamSession,
	getRemainingSeconds,
	startExamSession,
	selectExamQuestions,
	saveExamAnswer
} from '$lib/services/exam.service';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
	const activeSession = await getActiveExamSession('SAA-C03');
	return {
		profile: profile ?? null,
		activeSession: activeSession
			? { id: activeSession.id, remainingSeconds: await getRemainingSeconds(activeSession.id) }
			: null
	};
};

export const actions: Actions = {
	start: async () => {
		const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));
		if (!profile) return { error: 'SAA-C03 profile not found. Run db:seed first.' };

		const existing = await getActiveExamSession('SAA-C03');
		if (existing) throw redirect(303, `/exam/session`);

		const questionIds = await selectExamQuestions(profile.id, profile.questionCount);
		if (questionIds.length < profile.questionCount) {
			return {
				error: `Not enough questions in the bank (${questionIds.length}/${profile.questionCount}). Import more questions first.`
			};
		}

		const sessionId = await startExamSession(profile.id, profile.durationMinutes);

		for (const q of questionIds) {
			await saveExamAnswer(sessionId, q.id, [], false, null);
		}

		throw redirect(303, `/exam/session`);
	},

	abandon: async () => {
		const existing = await getActiveExamSession('SAA-C03');
		if (existing) {
			await db
				.update(examSessions)
				.set({ status: 'abandoned' })
				.where(eq(examSessions.id, existing.id));
		}
		throw redirect(303, `/exam`);
	}
};

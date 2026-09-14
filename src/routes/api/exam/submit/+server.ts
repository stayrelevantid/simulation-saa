import type { RequestHandler } from './$types';
import { submitExamSession } from '$lib/services/exam.service';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { sessionId } = body as { sessionId: number };

	if (typeof sessionId !== 'number') {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const session = await submitExamSession(sessionId);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	return json({
		submitted: true,
		sessionId: session.id,
		status: session.status,
		score: session.score,
		correctCount: session.correctCount,
		incorrectCount: session.incorrectCount
	});
};

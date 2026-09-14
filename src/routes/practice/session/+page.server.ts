import type { PageServerLoad } from './$types';
import {
	selectQuestions,
	selectWrongQuestions,
	createPracticeSession
} from '$lib/services/question.service';
import type { Difficulty, QuestionType } from '$lib/types/question';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;
	const mode = params.get('mode') === 'wrong' ? 'wrong' : 'practice';

	let questions;

	if (mode === 'wrong') {
		questions = await selectWrongQuestions(50);
	} else {
		const count = Number(params.get('count') ?? '10') || 10;
		const difficulties = params.getAll('difficulty') as Difficulty[];
		const questionTypes = params.getAll('type') as QuestionType[];

		questions = await selectQuestions({
			count,
			domainId: params.get('domain') ? Number(params.get('domain')) : undefined,
			difficulty: difficulties.length > 0 ? difficulties : undefined,
			questionType: questionTypes.length > 0 ? questionTypes : undefined
		});
	}

	if (questions.length === 0) {
		throw error(
			404,
			mode === 'wrong' ? 'No wrong answers to practice yet.' : 'No questions match your filters.'
		);
	}

	const sessionId = await createPracticeSession({ count: questions.length, mode });

	return { questions, sessionId, mode };
};

import type { PageServerLoad, Actions } from './$types';
import { listDomains } from '$lib/repositories/question.repository';
import { countAvailableQuestions, countWrongQuestions } from '$lib/services/question.service';
import { fail, redirect } from '@sveltejs/kit';
import type { Difficulty, QuestionType } from '$lib/types/question';

const VALID_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const VALID_QUESTION_TYPES: QuestionType[] = ['single', 'multiple'];

export const load: PageServerLoad = async ({ url }) => {
	const domains = await listDomains();
	const mode = url.searchParams.get('mode') === 'wrong' ? 'wrong' : 'practice';
	const wrongCount = mode === 'wrong' ? await countWrongQuestions() : 0;
	return { domains, mode, wrongCount };
};

export const actions: Actions = {
	start: async ({ request }) => {
		const formData = await request.formData();
		const mode = String(formData.get('mode') ?? 'practice') as 'practice' | 'wrong';

		if (mode !== 'practice' && mode !== 'wrong') {
			return fail(400, { error: 'Invalid practice mode.', fields: { count: '' } });
		}

		const rawCount = String(formData.get('count') ?? '');
		const count = Number(rawCount);
		if (!rawCount || Number.isNaN(count) || !Number.isInteger(count) || count < 1 || count > 100) {
			return fail(400, {
				error: 'Question count must be a whole number between 1 and 100.',
				fields: { count: rawCount }
			});
		}

		const domainIdRaw = formData.get('domainId');
		let domainId: number | undefined;
		if (domainIdRaw) {
			domainId = Number(domainIdRaw);
			if (Number.isNaN(domainId)) {
				return fail(400, {
					error: 'Invalid domain selection.',
					fields: { count: rawCount }
				});
			}
		}

		const difficulties = formData.getAll('difficulty').map(String);
		if (difficulties.length === 0) {
			return fail(400, {
				error: 'Select at least one difficulty level.',
				fields: { count: rawCount }
			});
		}
		if (difficulties.some((d) => !VALID_DIFFICULTIES.includes(d as Difficulty))) {
			return fail(400, {
				error: 'Invalid difficulty selection.',
				fields: { count: rawCount }
			});
		}

		const questionTypes = formData.getAll('questionType').map(String);
		if (questionTypes.length === 0) {
			return fail(400, {
				error: 'Select at least one question type.',
				fields: { count: rawCount }
			});
		}
		if (questionTypes.some((t) => !VALID_QUESTION_TYPES.includes(t as QuestionType))) {
			return fail(400, {
				error: 'Invalid question type selection.',
				fields: { count: rawCount }
			});
		}

		if (mode === 'wrong') {
			const wrongCount = await countWrongQuestions();
			if (wrongCount === 0) {
				return fail(400, {
					error: 'You have no wrong answers to practice yet.',
					fields: { count: rawCount }
				});
			}
			throw redirect(303, `/practice/session?mode=wrong`);
		}

		const available = await countAvailableQuestions({
			domainId,
			difficulty: difficulties as Difficulty[],
			questionType: questionTypes as QuestionType[]
		});
		if (available === 0) {
			return fail(400, {
				error: 'No questions match your selected filters. Broaden your filters and try again.',
				fields: { count: rawCount }
			});
		}
		if (available < count) {
			return fail(400, {
				error: `Only ${available} question${available === 1 ? '' : 's'} match your selected filters. Choose fewer questions or broaden your filters.`,
				fields: { count: rawCount }
			});
		}

		const params = new URLSearchParams({
			count: String(count),
			mode
		});
		if (domainId) params.set('domain', String(domainId));
		for (const difficulty of difficulties) {
			params.append('difficulty', difficulty);
		}
		for (const questionType of questionTypes) {
			params.append('type', questionType);
		}

		throw redirect(303, `/practice/session?${params.toString()}`);
	}
};

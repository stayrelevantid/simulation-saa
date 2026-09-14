import type { Actions, PageServerLoad } from './$types';
import {
	listQuestions,
	countQuestions,
	listDomains,
	listServices,
	toggleBookmark
} from '$lib/repositories/question.repository';
import type { Difficulty, QuestionType } from '$lib/types/question';
import { fail } from '@sveltejs/kit';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const params = url.searchParams;
	const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

	const filters = {
		domainId: params.get('domain') ? Number(params.get('domain')) : undefined,
		difficulty: (params.get('difficulty') as Difficulty) || undefined,
		questionType: (params.get('type') as QuestionType) || undefined,
		service: params.get('service') || undefined,
		search: params.get('search') || undefined,
		limit: PAGE_SIZE,
		offset: (page - 1) * PAGE_SIZE
	};

	const [questions, total, domains, services] = await Promise.all([
		listQuestions(filters),
		countQuestions(filters),
		listDomains(),
		listServices()
	]);

	return {
		questions,
		total,
		page,
		pageSize: PAGE_SIZE,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		domains,
		services,
		currentFilters: {
			domain: params.get('domain') ?? '',
			difficulty: params.get('difficulty') ?? '',
			type: params.get('type') ?? '',
			service: params.get('service') ?? '',
			search: params.get('search') ?? ''
		}
	};
};

export const actions: Actions = {
	toggleBookmark: async ({ request }) => {
		const formData = await request.formData();
		const questionId = Number(formData.get('questionId'));
		if (!questionId || Number.isNaN(questionId)) {
			return fail(400, { error: 'Invalid question ID' });
		}
		const bookmarked = await toggleBookmark(questionId);
		return { bookmarked };
	}
};

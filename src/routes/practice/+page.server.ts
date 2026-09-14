import type { PageServerLoad, Actions } from './$types';
import { listDomains } from '$lib/repositories/question.repository';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const domains = await listDomains();
	const mode = url.searchParams.get('mode') === 'wrong' ? 'wrong' : 'practice';
	return { domains, mode };
};

export const actions: Actions = {
	start: async ({ request }) => {
		const formData = await request.formData();
		const mode = String(formData.get('mode') ?? 'practice') as 'practice' | 'wrong';

		const rawCount = String(formData.get('count') ?? '10');
		const count = Number(rawCount);
		if (!count || count < 1 || count > 100) {
			return fail(400, { error: 'Question count must be between 1 and 100.' });
		}

		const domainId = formData.get('domainId') ? Number(formData.get('domainId')) : undefined;

		const difficulties = formData.getAll('difficulty').map(String).filter(Boolean);
		if (difficulties.length > 1) {
			return fail(400, {
				error: 'Select one difficulty level for now, or leave all unchecked for any level.'
			});
		}

		const questionTypes = formData.getAll('questionType').map(String).filter(Boolean);
		if (questionTypes.length > 1) {
			return fail(400, {
				error: 'Select one question type for now, or leave all unchecked for any type.'
			});
		}

		const params = new URLSearchParams({
			count: String(count),
			mode
		});
		if (domainId) params.set('domain', String(domainId));
		if (difficulties.length === 1) params.set('difficulty', difficulties[0]);
		if (questionTypes.length === 1) params.set('type', questionTypes[0]);

		throw redirect(303, `/practice/session?${params.toString()}`);
	}
};

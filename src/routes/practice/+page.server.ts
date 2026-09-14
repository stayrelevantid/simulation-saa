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

		const count = Number(formData.get('count') ?? '10');
		if (!count || count < 1 || count > 100) {
			return fail(400, { error: 'Question count must be between 1 and 100.' });
		}

		const domainId = formData.get('domainId') ? Number(formData.get('domainId')) : undefined;
		const difficulty = (formData.get('difficulty') as string) || undefined;
		const questionType = (formData.get('questionType') as string) || undefined;

		const params = new URLSearchParams({
			count: String(count),
			mode
		});
		if (domainId) params.set('domain', String(domainId));
		if (difficulty) params.set('difficulty', difficulty);
		if (questionType) params.set('type', questionType);

		throw redirect(303, `/practice/session?${params.toString()}`);
	}
};

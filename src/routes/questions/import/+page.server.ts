import type { Actions } from './$types';
import { seedProfile, importQuestions } from '$lib/db/seed';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	import: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Please upload a JSON file.' });
		}

		let items: unknown[];
		try {
			const parsed = JSON.parse(await file.text());
			items = Array.isArray(parsed) ? parsed : [parsed];
		} catch {
			return fail(400, { error: 'Invalid JSON file.' });
		}

		const { profile, domains } = await seedProfile();
		const result = await importQuestions(items, profile.id, domains);

		return {
			success: true as const,
			detected: items.length,
			imported: result.valid,
			duplicates: result.duplicates,
			invalid: result.invalid,
			errors: result.errors.slice(0, 20)
		};
	}
};

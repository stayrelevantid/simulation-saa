import type { RequestHandler } from './$types';
import { getProviderFromEnv } from '$lib/ai/provider-env';
import { OpenCodeProviderError } from '$lib/ai/opencode';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const provider = getProviderFromEnv();
		const models = await provider.listModels();
		return json({ models });
	} catch (err) {
		if (err instanceof OpenCodeProviderError) {
			return json({ error: err.message }, { status: 502 });
		}
		return json({ error: 'Failed to list models' }, { status: 500 });
	}
};

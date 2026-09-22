import type { RequestHandler } from './$types';
import { listGenerationHistory } from '$lib/ai/generator';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	const history = await listGenerationHistory(10);
	return json({ history });
};

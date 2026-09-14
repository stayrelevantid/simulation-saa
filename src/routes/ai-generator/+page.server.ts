import type { PageServerLoad } from './$types';
import { listDomains } from '$lib/repositories/question.repository';
import { listGenerationHistory } from '$lib/ai/generator';

export const load: PageServerLoad = async () => {
	const domains = await listDomains();
	const history = await listGenerationHistory(10);
	return { domains, history };
};

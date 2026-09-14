import type { PageServerLoad } from './$types';
import { listExamHistory } from '$lib/repositories/review.repository';

export const load: PageServerLoad = async () => {
	return { history: await listExamHistory() };
};

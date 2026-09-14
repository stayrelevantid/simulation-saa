import type { PageServerLoad } from './$types';
import { getOverallStats, getWeakDomains } from '$lib/services/statistics.service';

export const load: PageServerLoad = async () => {
	const [overall, weakDomains] = await Promise.all([getOverallStats(), getWeakDomains(5)]);
	return { overall, weakDomains };
};

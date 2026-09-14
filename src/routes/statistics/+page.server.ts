import type { PageServerLoad } from './$types';
import {
	getOverallStats,
	getDomainStats,
	getServiceStats,
	getWeakDomains
} from '$lib/services/statistics.service';

export const load: PageServerLoad = async () => {
	const [overall, domains, services, weakDomains] = await Promise.all([
		getOverallStats(),
		getDomainStats(),
		getServiceStats(),
		getWeakDomains()
	]);

	return { overall, domains, services, weakDomains };
};

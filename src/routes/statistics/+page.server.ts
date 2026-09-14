import type { PageServerLoad } from './$types';
import {
	getOverallStats,
	getDomainStats,
	getServiceStats,
	getWeakDomains
} from '$lib/services/statistics.service';
import { listExamHistory } from '$lib/repositories/review.repository';
import { db } from '$lib/db/client';
import { examProfiles } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { shortDate, dedupeLabels } from '$lib/components/statistics/chart-utils';

export const load: PageServerLoad = async () => {
	const [overall, domains, services, weakDomains, history] = await Promise.all([
		getOverallStats(),
		getDomainStats(),
		getServiceStats(),
		getWeakDomains(),
		listExamHistory()
	]);

	const [profile] = await db.select().from(examProfiles).where(eq(examProfiles.code, 'SAA-C03'));

	const dated = history
		.filter((h) => h.score !== null && h.completedAt !== null)
		.slice()
		.reverse();

	const labels = dedupeLabels(dated.map((h) => shortDate(h.completedAt as string)));

	const scoreHistory = dated.map((h, index) => ({
		score: h.score as number,
		label: labels[index]
	}));

	return {
		overall,
		domains,
		services,
		weakDomains,
		scoreHistory,
		passingScore: profile?.passingScore ?? 720
	};
};

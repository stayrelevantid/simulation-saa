import type { RequestHandler } from './$types';
import { getJobStatus } from '$lib/ai/generator';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
	const jobId = Number(params.id);
	if (Number.isNaN(jobId)) {
		return json({ error: 'Invalid job ID' }, { status: 400 });
	}

	const job = await getJobStatus(jobId);
	if (!job) {
		return json({ error: 'Job not found' }, { status: 404 });
	}

	return json(job);
};

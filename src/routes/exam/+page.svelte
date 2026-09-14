<script lang="ts">
	import { Alert, Badge, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';

	let { data, form }: PageProps = $props();

	function formatDuration(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}

	function formatRemaining(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}m ${s}s`;
	}
</script>

<PageContainer variant="narrow">
	<PageHeader
		title="SAA-C03 Mock Exam"
		subtitle="Full-length simulated exam. No feedback until you submit."
		centered
	/>

	{#if form?.error}
		<Alert color="red">{form.error}</Alert>
	{/if}

	{#if data.activeSession}
		<SectionCard variant="warning">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
						Exam session in progress
					</h2>
					<p class="mt-1 text-sm text-blue-grey-700 dark:text-blue-grey-200">
						The timer keeps running on the server — remaining time:
						<strong>{formatRemaining(data.activeSession.remainingSeconds)}</strong>.
					</p>
				</div>
				<Badge color="yellow">Active</Badge>
			</div>
			<div class="mt-4 flex flex-col gap-3 sm:flex-row">
				<Button href={resolve('/exam/session')} size="lg" class="w-full sm:w-auto">
					Resume Exam
				</Button>
				<form method="POST" action="?/abandon" class="w-full sm:w-auto">
					<Button type="submit" size="lg" color="red" outline class="w-full sm:w-auto">
						Abandon Exam
					</Button>
				</form>
			</div>
		</SectionCard>
	{/if}

	{#if data.profile && data.availableCount < data.profile.questionCount && !data.activeSession}
		<SectionCard variant="warning">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-base font-semibold text-yellow-800 dark:text-yellow-200">
						Question bank too small
					</h2>
					<p class="mt-1 text-sm text-blue-grey-700 dark:text-blue-grey-200">
						This exam needs {data.profile.questionCount} questions, but the bank has
						<strong>{data.availableCount}</strong>. Generate more questions with the AI Generator
						first.
					</p>
				</div>
				<div class="shrink-0">
					<Button href={resolve('/ai-generator')} color="primary" size="sm">
						Go to AI Generator
					</Button>
				</div>
			</div>
		</SectionCard>
	{/if}

	{#if data.profile}
		<SectionCard>
			<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">Exam Profile</h2>
			<dl class="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
				<dt class="text-blue-grey-500 dark:text-blue-grey-300">Exam</dt>
				<dd class="font-medium text-blue-grey-900 dark:text-white">{data.profile.name}</dd>
				<dt class="text-blue-grey-500 dark:text-blue-grey-300">Code</dt>
				<dd class="font-medium text-blue-grey-900 dark:text-white">{data.profile.code}</dd>
				<dt class="text-blue-grey-500 dark:text-blue-grey-300">Questions</dt>
				<dd class="font-medium text-blue-grey-900 dark:text-white">{data.profile.questionCount}</dd>
				<dt class="text-blue-grey-500 dark:text-blue-grey-300">Time Limit</dt>
				<dd class="font-medium text-blue-grey-900 dark:text-white">
					{formatDuration(data.profile.durationMinutes)}
				</dd>
				<dt class="text-blue-grey-500 dark:text-blue-grey-300">Passing Score</dt>
				<dd class="font-medium text-blue-grey-900 dark:text-white">
					{data.profile.passingScore} / {data.profile.scoreMax}
				</dd>
			</dl>
		</SectionCard>

		<SectionCard variant="info" padding="default">
			<ul class="list-inside list-disc space-y-1 text-xs text-blue-800 dark:text-blue-200">
				<li>Timer runs from the server — refreshing will not reset it.</li>
				<li>No explanations or feedback during the exam.</li>
				<li>You can flag questions and navigate freely.</li>
				<li>Answers are saved automatically.</li>
				<li>Exam auto-submits when time reaches 00:00:00.</li>
			</ul>
		</SectionCard>

		{#if !data.activeSession}
			<form method="POST" action="?/start">
				<Button type="submit" color="primary" size="lg" class="w-full">Start Mock Exam</Button>
			</form>
		{/if}
	{:else}
		<SectionCard>
			<p class="text-blue-grey-600 dark:text-blue-grey-200">
				Exam profile not found. Run <code>npm run db:seed</code> first.
			</p>
		</SectionCard>
	{/if}
</PageContainer>

<script lang="ts">
	import { Alert, Badge, Button, Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

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

<div class="mx-auto max-w-2xl space-y-4">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">SAA-C03 Mock Exam</h1>
		<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">
			Full-length simulated exam. No feedback until you submit.
		</p>
	</div>

	{#if form?.error}
		<Alert color="red">{form.error}</Alert>
	{/if}

	{#if data.activeSession}
		<Card
			class="rounded-xl border border-yellow-300 bg-yellow-050 shadow-sm dark:border-yellow-700 dark:bg-yellow-900/30"
		>
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
			<div class="mt-4 flex flex-wrap gap-3">
				<Button href={resolve('/exam/session')} size="lg">Resume Exam</Button>
				<form method="POST" action="?/abandon">
					<Button type="submit" size="lg" color="red" outline>Abandon Exam</Button>
				</form>
			</div>
		</Card>
	{/if}

	{#if data.profile}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">Exam Profile</h2>
			<dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
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

			<div
				class="mt-5 rounded-lg bg-blue-050 p-4 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
			>
				<ul class="list-inside list-disc space-y-1">
					<li>Timer runs from the server — refreshing will not reset it.</li>
					<li>No explanations or feedback during the exam.</li>
					<li>You can flag questions and navigate freely.</li>
					<li>Answers are saved automatically.</li>
					<li>Exam auto-submits when time reaches 00:00:00.</li>
				</ul>
			</div>

			{#if !data.activeSession}
				<form method="POST" action="?/start" class="mt-5">
					<Button type="submit" color="primary" size="lg" class="w-full">Start Mock Exam</Button>
				</form>
			{/if}
		</Card>
	{:else}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<p class="text-blue-grey-600 dark:text-blue-grey-200">
				Exam profile not found. Run <code>npm run db:seed</code> first.
			</p>
		</Card>
	{/if}
</div>

<script lang="ts">
	import { Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function formatDuration(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return h > 0 ? `${h}h ${m}m` : `${m}m`;
	}
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white">SAA-C03 Mock Exam</h1>

	{#if form?.error}
		<div class="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
			{form.error}
		</div>
	{/if}

	{#if data.activeSession}
		<Card class="border-amber-400 dark:border-amber-500">
			<h2 class="mb-2 text-lg font-semibold text-amber-600 dark:text-amber-400">
				Exam session restored
			</h2>
			<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
				You have an exam in progress. Timer does not reset — your remaining time is
				{Math.floor(data.activeSession.remainingSeconds / 60)} minutes
				{data.activeSession.remainingSeconds % 60} seconds.
			</p>
			<div class="flex gap-3">
				<Button href="/exam/session" color="primary">Resume Exam</Button>
				<form method="POST" action="?/abandon">
					<Button type="submit" color="gray" outline>Abandon Session</Button>
				</form>
			</div>
		</Card>
	{/if}

	{#if data.profile}
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Exam Profile</h2>
			<dl class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
				<dt class="text-gray-500 dark:text-gray-400">Exam</dt>
				<dd class="text-gray-900 dark:text-white">{data.profile.name}</dd>
				<dt class="text-gray-500 dark:text-gray-400">Code</dt>
				<dd class="text-gray-900 dark:text-white">{data.profile.code}</dd>
				<dt class="text-gray-500 dark:text-gray-400">Questions</dt>
				<dd class="text-gray-900 dark:text-white">{data.profile.questionCount}</dd>
				<dt class="text-gray-500 dark:text-gray-400">Time Limit</dt>
				<dd class="text-gray-900 dark:text-white">
					{formatDuration(data.profile.durationMinutes)}
				</dd>
				<dt class="text-gray-500 dark:text-gray-400">Passing Score</dt>
				<dd class="text-gray-900 dark:text-white">
					{data.profile.passingScore} / {data.profile.scoreMax}
				</dd>
			</dl>

			<div
				class="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
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
				<form method="POST" action="?/start" class="mt-4">
					<Button type="submit" color="primary" class="w-full">Start Mock Exam</Button>
				</form>
			{/if}
		</Card>
	{:else}
		<Card>
			<p class="text-gray-600 dark:text-gray-400">
				Exam profile not found. Run <code>npm run db:seed</code> first.
			</p>
		</Card>
	{/if}
</div>

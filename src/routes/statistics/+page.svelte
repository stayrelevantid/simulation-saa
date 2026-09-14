<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const domains = $derived(data.domains);
	const services = $derived(data.services);
	const hasPracticeData = $derived(overall.correct + overall.incorrect > 0);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	function barColor(accuracy: number): string {
		if (accuracy >= 0.8) return 'bg-teal-500';
		if (accuracy >= 0.6) return 'bg-yellow-500';
		return 'bg-red-500';
	}
</script>

<div class="mx-auto max-w-5xl space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">Statistics</h1>
			<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">
				Your performance across practice sessions.
			</p>
		</div>
		{#if overall.wrongQuestionCount > 0}
			<Button href={resolve('/practice') + '?mode=wrong'} color="red" size="sm">
				Practice {overall.wrongQuestionCount} Wrong Answers
			</Button>
		{/if}
	</div>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Attempted</div>
			<div class="mt-1 text-3xl font-bold text-blue-grey-800 dark:text-blue-grey-100">
				{overall.questionsAttempted}
			</div>
			<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">
				of {overall.questionsAvailable} available
			</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Correct</div>
			<div class="mt-1 text-3xl font-bold text-teal-600 dark:text-teal-300">{overall.correct}</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Incorrect</div>
			<div class="mt-1 text-3xl font-bold text-red-600 dark:text-red-300">{overall.incorrect}</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Accuracy</div>
			<div class="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-300">
				{hasPracticeData ? pct(overall.accuracy) : '–'}
			</div>
		</Card>
	</section>

	{#if !hasPracticeData}
		<Card class="text-center">
			<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">No data yet</h2>
			<p class="mx-auto mt-1 max-w-md text-sm text-blue-grey-600 dark:text-blue-grey-200">
				Complete a practice session to see your accuracy by domain and by AWS service.
			</p>
			<div class="mt-4 flex justify-center">
				<Button href={resolve('/practice')}>Start Practice</Button>
			</div>
		</Card>
	{/if}

	<div class="grid gap-4 lg:grid-cols-2">
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">
				Accuracy by Domain
			</h2>
			{#each domains as domain (domain.domainId)}
				<div class="mb-3">
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="text-blue-grey-700 dark:text-blue-grey-200">
							{domain.name}
							{#if domain.attempted === 0}
								<Badge color="gray" size="small">no data</Badge>
							{/if}
						</span>
						<span
							class="font-medium {domain.attempted > 0
								? 'text-blue-grey-900 dark:text-white'
								: 'text-blue-grey-400'}"
						>
							{domain.attempted > 0 ? pct(domain.accuracy) : '–'}
						</span>
					</div>
					<div class="h-2 w-full rounded-full bg-blue-grey-100 dark:bg-blue-grey-700">
						<div
							class="h-2 rounded-full {domain.attempted > 0 ? barColor(domain.accuracy) : ''}"
							style="width: {domain.attempted > 0 ? Math.round(domain.accuracy * 100) : 0}%"
						></div>
					</div>
				</div>
			{/each}
		</Card>

		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">
				Accuracy by AWS Service
			</h2>
			{#if services.length === 0}
				<p class="text-sm text-blue-grey-500 dark:text-blue-grey-300">No practice data yet.</p>
			{:else}
				{#each services as service (service.serviceName)}
					<div class="mb-3">
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="text-blue-grey-700 dark:text-blue-grey-200">{service.serviceName}</span>
							<span class="font-medium text-blue-grey-900 dark:text-white">
								{pct(service.accuracy)}
							</span>
						</div>
						<div class="h-2 w-full rounded-full bg-blue-grey-100 dark:bg-blue-grey-700">
							<div
								class="h-2 rounded-full {barColor(service.accuracy)}"
								style="width: {Math.round(service.accuracy * 100)}%"
							></div>
						</div>
					</div>
				{/each}
			{/if}
		</Card>
	</div>

	<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
		<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">Mock Exams</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Exams Taken</div>
				<div class="text-2xl font-bold text-purple-600 dark:text-purple-300">
					{overall.mockExamCount}
				</div>
			</div>
			<div>
				<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Average Score</div>
				<div class="text-2xl font-bold text-blue-grey-800 dark:text-blue-grey-100">
					{overall.averageScore ?? '–'}
				</div>
			</div>
		</div>
		{#if overall.mockExamCount > 0}
			<div class="mt-3">
				<Button href={resolve('/results')} size="sm" color="primary" outline>
					View Exam History
				</Button>
			</div>
		{/if}
	</Card>

	{#if data.weakDomains.length > 0}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<h2 class="mb-3 text-lg font-semibold text-blue-grey-900 dark:text-white">Weak Domains</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.weakDomains as domain (domain.domainId)}
					<Badge
						color={domain.accuracy >= 0.8 ? 'primary' : domain.accuracy >= 0.6 ? 'yellow' : 'red'}
						size="large"
					>
						{domain.name} · {pct(domain.accuracy)}
					</Badge>
				{/each}
			</div>
			<div class="mt-4">
				<Button href={resolve('/practice')} color="primary" size="sm">Targeted Practice</Button>
			</div>
		</Card>
	{/if}
</div>

<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const domains = $derived(data.domains);
	const services = $derived(data.services);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	function accuracyColor(accuracy: number): 'green' | 'yellow' | 'red' {
		if (accuracy >= 0.8) return 'green';
		if (accuracy >= 0.6) return 'yellow';
		return 'red';
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistics</h1>
		{#if overall.wrongQuestionCount > 0}
			<Button href="/practice?mode=wrong" color="red" size="sm">
				Practice {overall.wrongQuestionCount} Wrong Answers
			</Button>
		{/if}
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Questions Attempted</div>
			<div class="text-2xl font-bold text-gray-900 dark:text-white">
				{overall.questionsAttempted}
			</div>
			<div class="text-xs text-gray-400">of {overall.questionsAvailable} available</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Correct</div>
			<div class="text-2xl font-bold text-green-600 dark:text-green-400">{overall.correct}</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Incorrect</div>
			<div class="text-2xl font-bold text-red-600 dark:text-red-400">{overall.incorrect}</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
			<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{pct(overall.accuracy)}</div>
		</Card>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Accuracy by Domain</h2>
			{#each domains as domain (domain.domainId)}
				<div class="mb-3">
					<div class="mb-1 flex items-center justify-between text-sm">
						<span class="text-gray-700 dark:text-gray-300">
							{domain.name}
							{#if domain.attempted === 0}
								<Badge color="gray" size="small">no data</Badge>
							{/if}
						</span>
						<span class="font-medium {domain.attempted > 0 ? '' : 'text-gray-400'}">
							{domain.attempted > 0 ? pct(domain.accuracy) : '-'}
						</span>
					</div>
					<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
						<div
							class="h-2 rounded-full {domain.accuracy >= 0.8
								? 'bg-green-500'
								: domain.accuracy >= 0.6
									? 'bg-yellow-500'
									: 'bg-red-500'}"
							style="width: {domain.attempted > 0 ? Math.round(domain.accuracy * 100) : 0}%"
						></div>
					</div>
				</div>
			{/each}
		</Card>

		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
				Accuracy by AWS Service
			</h2>
			{#if services.length === 0}
				<p class="text-sm text-gray-500 dark:text-gray-400">No practice data yet.</p>
			{:else}
				{#each services as service (service.serviceName)}
					<div class="mb-3">
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="text-gray-700 dark:text-gray-300">{service.serviceName}</span>
							<span class="font-medium">{pct(service.accuracy)}</span>
						</div>
						<div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
							<div
								class="h-2 rounded-full {service.accuracy >= 0.8
									? 'bg-green-500'
									: service.accuracy >= 0.6
										? 'bg-yellow-500'
										: 'bg-red-500'}"
								style="width: {Math.round(service.accuracy * 100)}%"
							></div>
						</div>
					</div>
				{/each}
			{/if}
		</Card>
	</div>

	<Card>
		<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Mock Exams</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<div class="text-sm text-gray-500 dark:text-gray-400">Exams Taken</div>
				<div class="text-2xl font-bold text-gray-900 dark:text-white">{overall.mockExamCount}</div>
			</div>
			<div>
				<div class="text-sm text-gray-500 dark:text-gray-400">Average Score</div>
				<div class="text-2xl font-bold text-gray-900 dark:text-white">
					{overall.averageScore ?? '-'}
				</div>
			</div>
		</div>
		{#if overall.mockExamCount > 0}
			<div class="mt-3">
				<Button href="/results" size="sm" color="gray" outline>View Exam History</Button>
			</div>
		{/if}
	</Card>

	{#if data.weakDomains.length > 0}
		<Card>
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Weak Domains</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.weakDomains as domain (domain.domainId)}
					<Badge color={accuracyColor(domain.accuracy)} size="large">
						{domain.name} · {pct(domain.accuracy)}
					</Badge>
				{/each}
			</div>
			<div class="mt-4">
				<Button href="/practice" color="primary" size="sm">Targeted Practice</Button>
			</div>
		</Card>
	{/if}
</div>

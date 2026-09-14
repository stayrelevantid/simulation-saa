<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">SAA-C03 Practice Lab</h1>
		<p class="text-gray-700 dark:text-gray-400">
			AWS Certified Solutions Architect – Associate practice & mock exam environment.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Questions</div>
			<div class="text-2xl font-bold text-gray-900 dark:text-white">
				{overall.questionsAvailable}
			</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Questions Attempted</div>
			<div class="text-2xl font-bold text-gray-900 dark:text-white">
				{overall.questionsAttempted}
			</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
			<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
				{overall.correct + overall.incorrect > 0 ? pct(overall.accuracy) : '-'}
			</div>
		</Card>
		<Card>
			<div class="text-sm text-gray-500 dark:text-gray-400">Mock Exams</div>
			<div class="text-2xl font-bold text-gray-900 dark:text-white">{overall.mockExamCount}</div>
			{#if overall.averageScore !== null}
				<div class="text-xs text-gray-400">avg score {overall.averageScore}</div>
			{/if}
		</Card>
	</div>

	{#if data.weakDomains.length > 0}
		<Card>
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Weak Domains</h2>
			<div class="flex flex-wrap gap-2">
				{#each data.weakDomains as domain (domain.domainId)}
					<Badge
						color={domain.accuracy >= 0.8 ? 'green' : domain.accuracy >= 0.6 ? 'yellow' : 'red'}
						size="large"
					>
						{domain.name} · {pct(domain.accuracy)}
					</Badge>
				{/each}
			</div>
		</Card>
	{/if}

	<div class="flex flex-wrap gap-2">
		<Button href="/practice">Start Practice</Button>
		<Button href="/exam">Mock Exam</Button>
		<Button href="/ai-generator">AI Question Generator</Button>
		<Button href="/practice?mode=wrong">Wrong Answers ({overall.wrongQuestionCount})</Button>
	</div>
</div>

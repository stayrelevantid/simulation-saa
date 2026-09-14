<script lang="ts">
	import { Badge, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import MetricCard from '$lib/components/statistics/MetricCard.svelte';
	import ProgressMetric from '$lib/components/statistics/ProgressMetric.svelte';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const domains = $derived(data.domains);
	const services = $derived(data.services);
	const hasPracticeData = $derived(overall.correct + overall.incorrect > 0);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<PageContainer variant="wide">
	<PageHeader title="Statistics" subtitle="Your performance across practice sessions.">
		{#snippet actions()}
			{#if overall.wrongQuestionCount > 0}
				<Button href={resolve('/practice') + '?mode=wrong'} color="red" size="sm">
					Practice {overall.wrongQuestionCount} Wrong Answers
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<MetricCard
			label="Attempted"
			value={overall.questionsAttempted}
			hint="of {overall.questionsAvailable} available"
			color="neutral"
		/>
		<MetricCard label="Correct" value={overall.correct} color="teal" />
		<MetricCard label="Incorrect" value={overall.incorrect} color="red" />
		<MetricCard
			label="Accuracy"
			value={hasPracticeData ? pct(overall.accuracy) : '–'}
			color="blue"
		/>
	</section>

	{#if !hasPracticeData}
		<EmptyState
			icon="📊"
			title="No data yet"
			description="Complete a practice session to see your accuracy by domain and by AWS service."
			actionHref={resolve('/practice')}
			actionLabel="Start Practice"
		/>
	{:else}
		<div class="grid gap-4 lg:grid-cols-2">
			<SectionCard>
				<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">
					Accuracy by Domain
				</h2>
				<div class="space-y-3">
					{#each domains as domain (domain.domainId)}
						<ProgressMetric
							name={domain.name}
							accuracy={domain.accuracy}
							attempted={domain.attempted}
						/>
					{/each}
				</div>
			</SectionCard>

			<SectionCard>
				<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">
					Accuracy by AWS Service
				</h2>
				{#if services.length === 0}
					<p class="text-sm text-blue-grey-500 dark:text-blue-grey-300">No practice data yet.</p>
				{:else}
					<div class="space-y-3">
						{#each services as service (service.serviceName)}
							<ProgressMetric
								name={service.serviceName}
								accuracy={service.accuracy}
								attempted={service.attempted}
							/>
						{/each}
					</div>
				{/if}
			</SectionCard>
		</div>

		<SectionCard>
			<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">Mock Exams</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Exams Taken</div>
					<div class="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-300">
						{overall.mockExamCount}
					</div>
				</div>
				<div>
					<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Average Score</div>
					<div class="mt-1 text-2xl font-bold text-blue-grey-800 dark:text-blue-grey-100">
						{overall.averageScore ?? '–'}
					</div>
				</div>
			</div>
			{#if overall.mockExamCount > 0}
				<div class="mt-4">
					<Button href={resolve('/results')} size="sm" color="primary" outline>
						View Exam History
					</Button>
				</div>
			{/if}
		</SectionCard>

		{#if data.weakDomains.length > 0}
			<SectionCard>
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
			</SectionCard>
		{/if}
	{/if}
</PageContainer>

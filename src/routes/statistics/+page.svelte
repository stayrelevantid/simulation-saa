<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import MetricCard from '$lib/components/statistics/MetricCard.svelte';
	import DonutChart from '$lib/components/statistics/DonutChart.svelte';
	import HorizontalBars from '$lib/components/statistics/HorizontalBars.svelte';
	import ScoreTrend from '$lib/components/statistics/ScoreTrend.svelte';
	import { toBarItems, topByAccuracy, pct } from '$lib/components/statistics/chart-utils';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const hasPracticeData = $derived(overall.correct + overall.incorrect > 0);

	const domainBars = $derived(
		toBarItems(
			data.domains.map((d) => ({ value: d.accuracy, attempts: d.attempted })),
			(_item, index) => data.domains[index].name
		)
	);

	const serviceBars = $derived(
		topByAccuracy(data.services, 'serviceName', 8).map((s) => ({
			...s,
			color: toBarItems([s], () => s.label)[0].color
		}))
	);

	const weakBars = $derived(
		data.weakDomains.map((d) => ({
			label: d.name,
			value: d.accuracy,
			attempts: d.attempted,
			color: toBarItems([{ value: d.accuracy, attempts: d.attempted }], () => d.name)[0].color
		}))
	);
</script>

<PageContainer variant="wide">
	<PageHeader
		title="Statistics"
		subtitle="Your performance across practice sessions and mock exams."
	>
		{#snippet actions()}
			{#if overall.wrongQuestionCount > 0}
				<Button href={resolve('/practice') + '?mode=wrong'} color="red" size="sm">
					Practice {overall.wrongQuestionCount} Wrong Answers
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	<section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
			hint="correct / attempted"
			color="blue"
		/>
	</section>

	{#if !hasPracticeData}
		<EmptyState
			icon="📊"
			title="No data yet"
			description="Complete a practice session and a mock exam to see your accuracy, domain breakdown, and score trend here."
			actionHref={resolve('/practice')}
			actionLabel="Start Practice"
		/>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<SectionCard class="text-center">
				<h2 class="mb-4 text-lg font-semibold text-blue-grey-900 dark:text-white">
					Overall Accuracy
				</h2>
				<DonutChart correct={overall.correct} incorrect={overall.incorrect} />
			</SectionCard>

			<SectionCard>
				<h2 class="mb-5 text-lg font-semibold text-blue-grey-900 dark:text-white">
					Accuracy by Domain
				</h2>
				<HorizontalBars items={domainBars} emptyMessage="No practice data for these domains yet." />
			</SectionCard>
		</div>

		{#if data.scoreHistory.length >= 2}
			<SectionCard>
				<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
					<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Score Trend</h2>
					<span class="text-xs text-blue-grey-500 dark:text-blue-grey-300">
						{data.scoreHistory.length} mock exams · avg {overall.averageScore ?? '–'}
					</span>
				</div>
				<ScoreTrend
					history={data.scoreHistory}
					passingScore={data.passingScore}
					scoreMin={100}
					scoreMax={1000}
				/>
			</SectionCard>
		{:else if overall.mockExamCount >= 1}
			<SectionCard>
				<div class="flex flex-wrap items-center justify-between gap-3">
					<div>
						<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Score Trend</h2>
						<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">
							Complete one more mock exam to see your score trend chart.
						</p>
					</div>
					<Button href={resolve('/results')} size="sm" color="primary" outline>
						View Exam History
					</Button>
				</div>
			</SectionCard>
		{/if}

		{#if serviceBars.length > 0}
			<SectionCard>
				<h2 class="mb-5 text-lg font-semibold text-blue-grey-900 dark:text-white">
					Top AWS Services by Accuracy
				</h2>
				<HorizontalBars
					items={serviceBars.map((s) => ({
						label: s.label,
						value: s.value,
						attempts: s.attempts,
						color: s.color
					}))}
				/>
			</SectionCard>
		{/if}

		{#if weakBars.length > 0}
			<SectionCard variant={weakBars[0].color === 'red' ? 'danger' : 'default'}>
				<h2 class="mb-5 text-lg font-semibold text-blue-grey-900 dark:text-white">Weak Domains</h2>
				<HorizontalBars items={weakBars} />
				<div class="mt-5">
					<Button href={resolve('/practice')} color="primary" size="sm">Targeted Practice</Button>
				</div>
			</SectionCard>
		{/if}
	{/if}
</PageContainer>

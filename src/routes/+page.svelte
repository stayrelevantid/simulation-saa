<script lang="ts">
	import { Badge, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import MetricCard from '$lib/components/statistics/MetricCard.svelte';
	import ProgressMetric from '$lib/components/statistics/ProgressMetric.svelte';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const hasActivity = $derived(overall.questionsAttempted > 0 || overall.mockExamCount > 0);
	const hasMistakes = $derived(overall.wrongQuestionCount > 0);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<PageContainer variant="wide">
	<SectionCard variant="highlighted" padding="large">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="max-w-2xl min-w-0">
				<Badge color="primary">AWS Certified Solutions Architect – Associate</Badge>
				<h1 class="mt-3 text-2xl font-bold text-blue-grey-900 sm:text-3xl dark:text-white">
					SAA-C03 Practice Lab
				</h1>
				<p class="mt-3 leading-relaxed text-blue-grey-600 dark:text-blue-grey-200">
					{overall.questionsAvailable} original scenario-based questions with detailed explanations, full
					65-question mock exams, and targeted practice for your weak areas.
				</p>
			</div>
			<div class="flex flex-col gap-3 sm:flex-row lg:shrink-0">
				<Button href={resolve('/practice')} size="lg" class="w-full sm:w-auto">
					Start Practice
				</Button>
				<Button href={resolve('/exam')} size="lg" color="primary" outline class="w-full sm:w-auto">
					Mock Exam
				</Button>
			</div>
		</div>
	</SectionCard>

	<section class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
		<MetricCard
			label="Questions"
			value={overall.questionsAvailable}
			hint="in the bank"
			color="blue"
		/>
		<MetricCard
			label="Attempted"
			value={overall.questionsAttempted}
			hint="{overall.correct + overall.incorrect} answers"
			color="neutral"
		/>
		<MetricCard
			label="Accuracy"
			value={overall.correct + overall.incorrect > 0 ? pct(overall.accuracy) : '–'}
			hint="{overall.correct} correct"
			color="teal"
		/>
		<MetricCard
			label="Mock Exams"
			value={overall.mockExamCount}
			hint={overall.averageScore !== null ? `avg score ${overall.averageScore}` : 'not taken yet'}
			color="purple"
		/>
	</section>

	{#if overall.questionsAvailable === 0}
		<SectionCard variant="warning">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div class="min-w-0">
					<h2 class="text-base font-semibold text-yellow-800 dark:text-yellow-200">
						Your question bank is empty
					</h2>
					<p class="mt-1 text-sm text-blue-grey-700 dark:text-blue-grey-200">
						Generate your first scenario-based questions with the AI Generator to start practicing
						and taking mock exams.
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

	{#if !hasActivity}
		<EmptyState
			icon="🚀"
			title="Get started"
			description="You haven't answered any questions yet. Start a short practice session or take a full mock exam to see your statistics here."
			actionHref={resolve('/practice')}
			actionLabel="Start Practice"
		/>
	{:else}
		<div class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
			{#if data.weakDomains.length > 0}
				<SectionCard>
					<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Weak Domains</h2>
							<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">
								Your lowest accuracy areas to focus on next.
							</p>
						</div>
						<Button href={resolve('/statistics')} size="sm" color="primary" outline>
							View Statistics
						</Button>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each data.weakDomains as domain (domain.domainId)}
							<ProgressMetric
								name={domain.name}
								accuracy={domain.accuracy}
								attempted={domain.attempted}
							/>
						{/each}
					</div>
				</SectionCard>
			{/if}

			<SectionCard variant={hasMistakes ? 'danger' : 'default'}>
				<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">My Mistakes</h2>
				<p class="mt-2 text-sm text-blue-grey-600 dark:text-blue-grey-200">
					{hasMistakes
						? `${overall.wrongQuestionCount} question${overall.wrongQuestionCount === 1 ? '' : 's'} you answered incorrectly. Review them to close the gap.`
						: 'No wrong answers yet — keep practicing!'}
				</p>
				<div class="mt-5 flex flex-col gap-3 sm:flex-row">
					<Button
						href={resolve('/practice') + '?mode=wrong'}
						color={hasMistakes ? 'red' : 'primary'}
						outline={!hasMistakes}
						class="w-full sm:w-auto"
					>
						{hasMistakes
							? `Practice ${overall.wrongQuestionCount} Wrong Answers`
							: 'Browse Practice'}
					</Button>
				</div>
			</SectionCard>
		</div>
	{/if}
</PageContainer>

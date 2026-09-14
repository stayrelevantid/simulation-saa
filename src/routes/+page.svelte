<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
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
	const hasActivity = $derived(overall.questionsAttempted > 0 || overall.mockExamCount > 0);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<PageContainer variant="wide">
	<PageHeader
		title="SAA-C03 Practice Lab"
		subtitle="Practice scenario-based questions, take full mock exams, review every explanation, and focus on your weak domains."
	/>

	<SectionCard padding="large">
		<div class="md:flex md:items-center md:justify-between md:gap-6">
			<div class="max-w-2xl">
				<Badge color="primary" class="mb-3">AWS Certified Solutions Architect – Associate</Badge>
				<p class="mt-2 text-blue-grey-600 dark:text-blue-grey-200">
					{overall.questionsAvailable} original scenario-based questions with detailed explanations, full
					65-question mock exams, and targeted practice for your weak areas.
				</p>
			</div>
			<div class="mt-5 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
				<Button href={resolve('/practice')} size="lg">Start Practice</Button>
				<Button href={resolve('/exam')} size="lg" color="primary" outline>Mock Exam</Button>
			</div>
		</div>
	</SectionCard>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

	{#if !hasActivity}
		<EmptyState
			icon="🚀"
			title="Get started"
			description="You haven't answered any questions yet. Start a short practice session or take a full mock exam to see your statistics here."
			actionHref={resolve('/practice')}
			actionLabel="Start Practice"
		/>
	{:else if data.weakDomains.length > 0}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Weak Domains</h2>
				<Button href={resolve('/statistics')} size="sm" color="primary" outline>
					View Statistics
				</Button>
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.weakDomains as domain (domain.domainId)}
					<ProgressMetric
						name={domain.name}
						accuracy={domain.accuracy}
						attempted={domain.attempted}
					/>
				{/each}
			</div>
		</Card>
	{/if}

	{#if hasActivity}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">My Mistakes</h2>
					<p class="text-sm text-blue-grey-600 dark:text-blue-grey-200">
						{overall.wrongQuestionCount > 0
							? `${overall.wrongQuestionCount} questions you answered incorrectly.`
							: 'No wrong answers yet — keep practicing!'}
					</p>
				</div>
				<Button
					href={resolve('/practice') + '?mode=wrong'}
					color={overall.wrongQuestionCount > 0 ? 'red' : 'primary'}
					outline={overall.wrongQuestionCount === 0}
				>
					{overall.wrongQuestionCount > 0
						? `Practice ${overall.wrongQuestionCount} Wrong Answers`
						: 'Wrong Answers'}
				</Button>
			</div>
		</Card>
	{/if}
</PageContainer>

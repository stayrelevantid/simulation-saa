<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const overall = $derived(data.overall);
	const hasActivity = $derived(overall.questionsAttempted > 0 || overall.mockExamCount > 0);

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}
</script>

<div class="space-y-8">
	<section
		class="rounded-xl border border-blue-grey-100 bg-white p-6 shadow-sm md:p-8 dark:border-blue-grey-800 dark:bg-blue-grey-800"
	>
		<div class="md:flex md:items-center md:justify-between md:gap-6">
			<div class="max-w-2xl">
				<Badge color="primary" class="mb-3">AWS Certified Solutions Architect – Associate</Badge>
				<h1 class="text-2xl font-bold text-blue-grey-900 md:text-3xl dark:text-white">
					SAA-C03 Practice Lab
				</h1>
				<p class="mt-2 text-blue-grey-600 dark:text-blue-grey-200">
					Practice scenario-based questions, take full mock exams, review every explanation, and
					focus on your weak domains.
				</p>
			</div>
			<div class="mt-5 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
				<Button href={resolve('/practice')} size="lg">Start Practice</Button>
				<Button href={resolve('/exam')} size="lg" color="primary" outline>Mock Exam</Button>
			</div>
		</div>
	</section>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Questions</div>
			<div class="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-300">
				{overall.questionsAvailable}
			</div>
			<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">in the bank</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Attempted</div>
			<div class="mt-1 text-3xl font-bold text-blue-grey-800 dark:text-blue-grey-100">
				{overall.questionsAttempted}
			</div>
			<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">
				{overall.correct + overall.incorrect} answers
			</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Accuracy</div>
			<div class="mt-1 text-3xl font-bold text-teal-600 dark:text-teal-300">
				{overall.correct + overall.incorrect > 0 ? pct(overall.accuracy) : '–'}
			</div>
			<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">
				{overall.correct} correct
			</div>
		</Card>
		<Card class="text-center">
			<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">Mock Exams</div>
			<div class="mt-1 text-3xl font-bold text-purple-600 dark:text-purple-300">
				{overall.mockExamCount}
			</div>
			<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">
				{overall.averageScore !== null ? `avg score ${overall.averageScore}` : 'not taken yet'}
			</div>
		</Card>
	</section>

	{#if data.weakDomains.length > 0}
		<Card>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Weak Domains</h2>
				<Button href={resolve('/statistics')} size="sm" color="primary" outline>
					View Statistics
				</Button>
			</div>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.weakDomains as domain (domain.domainId)}
					<div class="rounded-lg border border-blue-grey-100 p-3 dark:border-blue-grey-700">
						<div class="mb-1 flex items-center justify-between text-sm">
							<span class="font-medium text-blue-grey-800 dark:text-blue-grey-100">
								{domain.name}
							</span>
							<Badge
								color={domain.accuracy >= 0.8
									? 'primary'
									: domain.accuracy >= 0.6
										? 'yellow'
										: 'red'}
							>
								{domain.attempted > 0 ? pct(domain.accuracy) : 'no data'}
							</Badge>
						</div>
						<div class="h-2 w-full rounded-full bg-blue-grey-100 dark:bg-blue-grey-700">
							<div
								class="h-2 rounded-full {domain.accuracy >= 0.8
									? 'bg-teal-500'
									: domain.accuracy >= 0.6
										? 'bg-yellow-500'
										: 'bg-red-500'}"
								style="width: {domain.attempted > 0 ? Math.round(domain.accuracy * 100) : 0}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	{#if !hasActivity}
		<Card class="text-center">
			<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Get started</h2>
			<p class="mx-auto mt-1 max-w-md text-sm text-blue-grey-600 dark:text-blue-grey-200">
				You haven't answered any questions yet. Start a short practice session or take a full mock
				exam to see your statistics here.
			</p>
			<div class="mt-4 flex justify-center gap-3">
				<Button href={resolve('/practice')}>Start Practice</Button>
				<Button href={resolve('/questions')} color="primary" outline>Browse Question Bank</Button>
			</div>
		</Card>
	{/if}

	<Card>
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
</div>

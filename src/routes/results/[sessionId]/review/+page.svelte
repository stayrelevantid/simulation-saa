<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';
	import type { ReviewFilter } from '$lib/repositories/review.repository';

	let { data }: PageProps = $props();

	let filter = $state<ReviewFilter>('all');

	const questions = $derived(data.questions);
	const counts = $derived(data.counts);

	const filtered = $derived.by(() => {
		switch (filter) {
			case 'correct':
				return questions.filter((q) => q.isCorrect);
			case 'incorrect':
				return questions.filter((q) => !q.isCorrect);
			case 'flagged':
				return questions.filter((q) => q.flagged);
			default:
				return questions;
		}
	});

	const filterButtons = $derived.by(() => {
		const buttons: {
			key: ReviewFilter;
			label: string;
			color: 'primary' | 'teal' | 'red' | 'yellow';
		}[] = [
			{ key: 'all', label: `All (${counts.all})`, color: 'primary' },
			{ key: 'correct', label: `Correct (${counts.correct})`, color: 'teal' },
			{ key: 'incorrect', label: `Incorrect (${counts.incorrect})`, color: 'red' },
			{ key: 'flagged', label: `Flagged (${counts.flagged})`, color: 'yellow' }
		];
		return buttons;
	});
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<div class="flex items-center justify-between">
		<Button href={`/results/${data.sessionId}`} size="sm" color="primary" outline>
			← Back to Result
		</Button>
		<h1 class="text-xl font-bold text-blue-grey-900 dark:text-white">Exam Review</h1>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each filterButtons as fb (fb.key)}
			<Button
				size="sm"
				color={filter === fb.key ? fb.color : 'primary'}
				outline={filter !== fb.key}
				onclick={() => (filter = fb.key)}
			>
				{fb.label}
			</Button>
		{/each}
	</div>

	{#each filtered as q (q.questionId)}
		<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<span class="text-sm font-semibold text-blue-grey-500 dark:text-blue-grey-300">
					Question {q.questionNumber}
				</span>
				<Badge color={q.isCorrect ? 'primary' : 'red'}>
					{q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
				</Badge>
				{#if q.flagged}
					<Badge color="yellow">⚑ Flagged</Badge>
				{/if}
				<Badge color="blue">{q.domainName}</Badge>
			</div>

			<p class="whitespace-pre-line text-blue-grey-900 dark:text-white">{q.questionText}</p>

			<div class="mt-4 space-y-2">
				{#each q.options as option (option.optionKey)}
					{@const wasSelected = q.selected.includes(option.optionKey)}
					{@const isCorrectOption = option.isCorrect}
					<div
						class="rounded-lg border p-3
							{isCorrectOption
							? 'border-teal-500 bg-teal-050 dark:border-teal-600 dark:bg-teal-900/40'
							: wasSelected
								? 'border-red-500 bg-red-050 dark:border-red-600 dark:bg-red-900/40'
								: 'border-blue-grey-200 dark:border-blue-grey-700'}"
					>
						<div class="flex items-start gap-2">
							<span class="font-bold text-blue-grey-900 dark:text-white">
								{#if q.questionType === 'multiple'}
									{wasSelected ? '☑' : '☐'}
								{/if}
								{option.optionKey}.
							</span>
							<span class="text-blue-grey-800 dark:text-blue-grey-100">{option.optionText}</span>
							{#if isCorrectOption}
								<Badge color="primary" class="ml-auto shrink-0">Correct Answer</Badge>
							{:else if wasSelected}
								<Badge color="red" class="ml-auto shrink-0">Your Answer</Badge>
							{/if}
						</div>
						{#if option.explanation && (isCorrectOption || wasSelected)}
							<p class="mt-2 pl-6 text-sm text-blue-grey-600 dark:text-blue-grey-300">
								{option.explanation}
							</p>
						{/if}
					</div>
				{/each}
			</div>

			<div class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
				<div class="rounded-lg bg-blue-grey-050 p-3 dark:bg-blue-grey-900">
					<p class="font-semibold text-blue-grey-700 dark:text-blue-grey-200">Your Answer</p>
					<p class="text-blue-grey-600 dark:text-blue-grey-300">
						{q.selected.length > 0 ? q.selected.join(', ') : 'Not answered'}
					</p>
				</div>
				<div class="rounded-lg bg-blue-grey-050 p-3 dark:bg-blue-grey-900">
					<p class="font-semibold text-blue-grey-700 dark:text-blue-grey-200">Correct Answer</p>
					<p class="text-blue-grey-600 dark:text-blue-grey-300">{q.correctKeys.join(', ')}</p>
				</div>
			</div>

			<div class="mt-4">
				<h3 class="font-semibold text-blue-grey-900 dark:text-white">Explanation</h3>
				<p class="text-sm text-blue-grey-700 dark:text-blue-grey-200">{q.explanation}</p>
			</div>

			{#if q.keyConcept}
				<div class="mt-3">
					<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">
						Key Concept
					</h3>
					<Badge color="primary">{q.keyConcept}</Badge>
				</div>
			{/if}

			{#if q.reference}
				<div class="mt-2">
					<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">
						Reference
					</h3>
					<p class="text-sm text-blue-grey-600 dark:text-blue-grey-300">{q.reference}</p>
				</div>
			{/if}
		</Card>
	{/each}

	{#if filtered.length === 0}
		<div
			class="rounded-lg border border-blue-grey-200 p-8 text-center text-blue-grey-500 dark:border-blue-grey-700 dark:text-blue-grey-300"
		>
			No questions in this category.
		</div>
	{/if}
</div>

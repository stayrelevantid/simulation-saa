<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';
	import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS } from '$lib/types/question';

	let { data }: PageProps = $props();
	const question = $derived(data.question);

	const difficultyColor: Record<string, 'green' | 'yellow' | 'red'> = {
		easy: 'green',
		medium: 'yellow',
		hard: 'red'
	};
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<div class="flex items-center justify-between">
		<Button href="/questions" size="sm" color="gray" outline>← Back to Question Bank</Button>
		<form method="POST" action="?/toggleBookmark">
			<Button
				type="submit"
				size="sm"
				color={question.bookmarked ? 'yellow' : 'gray'}
				outline={!question.bookmarked}
			>
				{question.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
			</Button>
		</form>
	</div>

	<Card>
		<div class="mb-3 flex flex-wrap items-center gap-2">
			<span class="text-sm font-semibold text-blue-grey-500 dark:text-blue-grey-300"
				>Question #{question.id}</span
			>
			<Badge color={difficultyColor[question.difficulty]}
				>{DIFFICULTY_LABELS[question.difficulty]}</Badge
			>
			<Badge color="blue">{question.domainName}</Badge>
			<Badge color="gray">{QUESTION_TYPE_LABELS[question.questionType]}</Badge>
			<Badge color="indigo">{SOURCE_LABELS[question.source]}</Badge>
		</div>

		<p class="whitespace-pre-line text-blue-grey-900 dark:text-white">{question.questionText}</p>

		{#if question.services.length > 0}
			<div class="mt-3 flex flex-wrap items-center gap-2">
				<span class="text-xs text-blue-grey-500 dark:text-blue-grey-300">Services:</span>
				{#each question.services as service (service)}
					<Badge color="purple" size="small">{service}</Badge>
				{/each}
			</div>
		{/if}
	</Card>

	<Card>
		<h2 class="mb-3 text-lg font-semibold text-blue-grey-900 dark:text-white">Options</h2>
		<div class="space-y-2">
			{#each question.options as option (option.id)}
				<div
					class="rounded-lg border p-3 {option.isCorrect
						? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/40'
						: 'border-blue-grey-200 dark:border-blue-grey-700'}"
				>
					<div class="flex items-start gap-2">
						<span class="font-bold text-blue-grey-900 dark:text-white">{option.optionKey}.</span>
						<span class="text-blue-grey-800 dark:text-blue-grey-100">{option.optionText}</span>
						{#if option.isCorrect}
							<Badge color="green" class="ml-auto shrink-0">Correct Answer</Badge>
						{/if}
					</div>
					{#if option.explanation}
						<p class="mt-2 pl-6 text-sm text-blue-grey-600 dark:text-blue-grey-300">
							{option.explanation}
						</p>
					{/if}
				</div>
			{/each}
		</div>
	</Card>

	<Card>
		<h2 class="mb-2 text-lg font-semibold text-blue-grey-900 dark:text-white">Explanation</h2>
		<p class="whitespace-pre-line text-blue-grey-800 dark:text-blue-grey-100">
			{question.explanation}
		</p>

		{#if question.keyConcept}
			<div class="mt-4">
				<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">
					Key Concept
				</h3>
				<Badge color="teal">{question.keyConcept}</Badge>
			</div>
		{/if}

		{#if question.reference}
			<div class="mt-3">
				<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">Reference</h3>
				<p class="text-sm text-blue-grey-600 dark:text-blue-grey-300">{question.reference}</p>
			</div>
		{/if}
	</Card>
</div>

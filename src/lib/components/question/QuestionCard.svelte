<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { QuestionListItem } from '$lib/types/question';
	import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS } from '$lib/types/question';

	let {
		question,
		onToggleBookmark
	}: { question: QuestionListItem; onToggleBookmark: (id: number) => void } = $props();

	const difficultyColor: Record<string, 'primary' | 'yellow' | 'red'> = {
		easy: 'primary',
		medium: 'yellow',
		hard: 'red'
	};

	const truncatedText = $derived(
		question.questionText.length > 180
			? question.questionText.slice(0, 180) + '...'
			: question.questionText
	);
</script>

<Card
	class="mb-4 rounded-xl border-blue-grey-100 shadow-sm transition-colors hover:border-teal-300 dark:border-blue-grey-700 dark:hover:border-teal-700"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="flex-1">
			<div class="mb-2 flex flex-wrap items-center gap-2">
				<span class="text-sm font-semibold text-blue-grey-500 dark:text-blue-grey-300">
					Question #{question.id}
				</span>
				<Badge color={difficultyColor[question.difficulty] ?? 'gray'}>
					{DIFFICULTY_LABELS[question.difficulty]}
				</Badge>
				<Badge color="blue">{question.domainName}</Badge>
				<Badge color="gray">{QUESTION_TYPE_LABELS[question.questionType]}</Badge>
				<Badge color="purple">{SOURCE_LABELS[question.source]}</Badge>
			</div>

			<p class="text-blue-grey-900 dark:text-white">{truncatedText}</p>

			{#if question.services.length > 0}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class="text-xs text-blue-grey-500 dark:text-blue-grey-300">Services:</span>
					{#each question.services as service (service)}
						<Badge color="purple" size="small">{service}</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex w-full shrink-0 gap-2 sm:w-auto sm:flex-col">
			<Button
				href={`/questions/${question.id}`}
				size="sm"
				color="primary"
				outline
				class="flex-1 sm:flex-none"
			>
				View
			</Button>
			<Button
				size="sm"
				color={question.bookmarked ? 'primary' : 'gray'}
				outline={!question.bookmarked}
				onclick={() => onToggleBookmark(question.id)}
				class="flex-1 sm:flex-none"
			>
				{question.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
			</Button>
		</div>
	</div>
</Card>

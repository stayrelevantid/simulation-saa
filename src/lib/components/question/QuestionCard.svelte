<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { QuestionListItem } from '$lib/types/question';
	import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS } from '$lib/types/question';

	let {
		question,
		onToggleBookmark
	}: { question: QuestionListItem; onToggleBookmark: (id: number) => void } = $props();

	const difficultyColor: Record<string, 'green' | 'yellow' | 'red'> = {
		easy: 'green',
		medium: 'yellow',
		hard: 'red'
	};

	const truncatedText = $derived(
		question.questionText.length > 180
			? question.questionText.slice(0, 180) + '...'
			: question.questionText
	);
</script>

<Card class="mb-4">
	<div class="flex items-start justify-between gap-4">
		<div class="flex-1">
			<div class="mb-2 flex flex-wrap items-center gap-2">
				<span class="text-sm font-semibold text-gray-500 dark:text-gray-400">
					Question #{question.id}
				</span>
				<Badge color={difficultyColor[question.difficulty] ?? 'gray'}>
					{DIFFICULTY_LABELS[question.difficulty]}
				</Badge>
				<Badge color="blue">{question.domainName}</Badge>
				<Badge color="gray">{QUESTION_TYPE_LABELS[question.questionType]}</Badge>
				<Badge color="indigo">{SOURCE_LABELS[question.source]}</Badge>
			</div>

			<p class="text-gray-900 dark:text-white">{truncatedText}</p>

			{#if question.services.length > 0}
				<div class="mt-3 flex flex-wrap items-center gap-2">
					<span class="text-xs text-gray-500 dark:text-gray-400">Services:</span>
					{#each question.services as service (service)}
						<Badge color="purple" size="small">{service}</Badge>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex shrink-0 flex-col gap-2">
			<Button href="/questions/{question.id}" size="xs" outline>View</Button>
			<Button
				size="xs"
				color={question.bookmarked ? 'yellow' : 'gray'}
				outline={!question.bookmarked}
				onclick={() => onToggleBookmark(question.id)}
			>
				{question.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
			</Button>
		</div>
	</div>
</Card>

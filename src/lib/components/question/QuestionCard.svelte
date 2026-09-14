<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import type { QuestionListItem } from '$lib/types/question';
	import QuestionMeta from '$lib/components/question/QuestionMeta.svelte';

	let {
		question,
		onToggleBookmark
	}: { question: QuestionListItem; onToggleBookmark: (id: number) => void } = $props();

	const truncatedText = $derived(
		question.questionText.length > 180
			? question.questionText.slice(0, 180) + '...'
			: question.questionText
	);
</script>

<div
	class="rounded-xl border border-blue-grey-100 bg-white p-5 shadow-sm transition-colors hover:border-teal-300 dark:border-blue-grey-700 dark:bg-blue-grey-800 dark:hover:border-teal-700"
>
	<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div class="min-w-0 flex-1">
			<QuestionMeta
				questionNumber={question.id}
				questionType={question.questionType}
				difficulty={question.difficulty}
				domainName={question.domainName}
				source={question.source}
				services={question.services}
			/>

			<p class="mt-3 leading-relaxed text-blue-grey-900 dark:text-white">{truncatedText}</p>
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
</div>

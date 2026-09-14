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
	class="mx-auto w-full max-w-3xl rounded-xl border border-blue-grey-100 bg-white p-5 shadow-sm transition-colors hover:border-teal-300 sm:p-7 dark:border-blue-grey-700 dark:bg-blue-grey-800 dark:hover:border-teal-700"
>
	<div class="border-t-4 border-teal-500 pt-4">
		<div class="min-w-0">
			<QuestionMeta
				questionNumber={question.id}
				questionType={question.questionType}
				difficulty={question.difficulty}
				domainName={question.domainName}
				source={question.source}
				services={question.services}
			/>

			<p class="mx-auto mt-5 max-w-2xl text-left leading-7 text-blue-grey-900 dark:text-white">
				{truncatedText}
			</p>
		</div>

		<div
			class="mt-6 flex flex-col gap-3 border-t border-blue-grey-100 pt-4 sm:flex-row sm:justify-center dark:border-blue-grey-700"
		>
			<Button
				href={`/questions/${question.id}`}
				size="sm"
				color="primary"
				outline
				class="w-full sm:w-auto"
			>
				View
			</Button>
			<Button
				size="sm"
				color={question.bookmarked ? 'primary' : 'gray'}
				outline={!question.bookmarked}
				onclick={() => onToggleBookmark(question.id)}
				class="w-full sm:w-auto"
			>
				{question.bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
			</Button>
		</div>
	</div>
</div>

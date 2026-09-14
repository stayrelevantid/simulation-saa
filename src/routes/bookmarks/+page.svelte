<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import QuestionCard from '$lib/components/question/QuestionCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function toggleBookmark(questionId: number) {
		await fetch('/bookmarks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({ action: 'toggleBookmark', questionId: String(questionId) })
		});
		window.location.reload();
	}
</script>

<div class="space-y-4">
	<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">My Bookmarks</h1>

	{#each data.questions as question (question.id)}
		<QuestionCard {question} onToggleBookmark={toggleBookmark} />
	{/each}

	{#if data.questions.length === 0}
		<div
			class="rounded-lg border border-blue-grey-200 p-8 text-center text-blue-grey-500 dark:border-blue-grey-700 dark:text-blue-grey-300"
		>
			No bookmarks yet. Bookmark questions from the Question Bank to save them here.
		</div>
		<div class="flex justify-center">
			<Button href="/questions" color="primary">Browse Questions</Button>
		</div>
	{/if}
</div>

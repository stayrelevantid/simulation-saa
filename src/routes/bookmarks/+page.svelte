<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import QuestionCard from '$lib/components/question/QuestionCard.svelte';

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

<PageContainer variant="wide">
	<PageHeader title="My Bookmarks" subtitle="Questions you saved for later review." />

	{#if data.questions.length === 0}
		<EmptyState
			icon="★"
			title="No bookmarks yet"
			description="Bookmark questions from the Question Bank to save them here for later review."
			actionHref={resolve('/questions')}
			actionLabel="Browse Questions"
		/>
	{:else}
		<div class="grid gap-5">
			{#each data.questions as question (question.id)}
				<QuestionCard {question} onToggleBookmark={toggleBookmark} />
			{/each}
		</div>
	{/if}
</PageContainer>

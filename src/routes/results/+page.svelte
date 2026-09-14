<script lang="ts">
	import { Badge, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data }: PageProps = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString();
	}
</script>

<PageContainer variant="reading">
	<PageHeader title="Exam History" subtitle="Your completed mock exams." />

	{#if data.history.length === 0}
		<EmptyState
			icon="📝"
			title="No completed exams yet"
			description="Take your first full 65-question mock exam to see results and review here."
			actionHref={resolve('/exam')}
			actionLabel="Start Mock Exam"
		/>
	{:else}
		<div class="grid gap-4">
			{#each data.history as item (item.id)}
				<div
					class="flex flex-col gap-3 rounded-xl border border-blue-grey-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-blue-grey-700 dark:bg-blue-grey-800"
				>
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-semibold text-blue-grey-900 dark:text-white">
								{item.examCode} Mock #{item.id}
							</span>
							<Badge color={item.passed ? 'primary' : 'red'}>
								{item.passed ? 'PASS' : 'NOT YET'}
							</Badge>
						</div>
						<p class="mt-1 text-sm text-blue-grey-500 dark:text-blue-grey-300">
							Score: <strong>{item.score ?? '-'}</strong>
							· Correct: {item.correctCount ?? 0}
							· Incorrect: {item.incorrectCount ?? 0}
							· {formatDate(item.completedAt)}
						</p>
					</div>
					<Button
						href={`/results/${item.id}`}
						size="sm"
						color="primary"
						outline
						class="w-full sm:w-auto"
					>
						Review
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</PageContainer>

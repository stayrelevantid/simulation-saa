<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '-';
		return new Date(iso).toLocaleString();
	}
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">Exam History</h1>

	{#each data.history as item (item.id)}
		<Card>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<div class="flex items-center gap-2">
						<span class="font-semibold text-blue-grey-900 dark:text-white">
							{item.examCode} Mock #{item.id}
						</span>
						<Badge color={item.passed ? 'green' : 'red'}>{item.passed ? 'PASS' : 'NOT YET'}</Badge>
					</div>
					<p class="mt-1 text-sm text-blue-grey-500 dark:text-blue-grey-300">
						Score: <strong>{item.score ?? '-'}</strong>
						· Correct: {item.correctCount ?? 0}
						· Incorrect: {item.incorrectCount ?? 0}
						· {formatDate(item.completedAt)}
					</p>
				</div>
				<Button href="/results/{item.id}/review" size="sm" color="primary" outline>Review</Button>
			</div>
		</Card>
	{/each}

	{#if data.history.length === 0}
		<div
			class="rounded-lg border border-blue-grey-200 p-8 text-center text-blue-grey-500 dark:border-blue-grey-700 dark:text-blue-grey-300"
		>
			No completed exams yet.
		</div>
		<div class="flex justify-center">
			<Button href="/exam" color="primary">Start Mock Exam</Button>
		</div>
	{/if}
</div>

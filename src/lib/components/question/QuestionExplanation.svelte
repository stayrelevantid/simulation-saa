<script lang="ts">
	import { Badge } from 'flowbite-svelte';

	let {
		explanation,
		keyConcept,
		reference,
		correctKeys,
		selectedKeys,
		showAnswerComparison = false
	}: {
		explanation: string;
		keyConcept?: string | null;
		reference?: string | null;
		correctKeys?: string[];
		selectedKeys?: string[];
		showAnswerComparison?: boolean;
	} = $props();
</script>

{#if showAnswerComparison && correctKeys && selectedKeys}
	<div class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
		<div class="rounded-lg bg-blue-grey-050 p-3 dark:bg-blue-grey-900">
			<p class="font-semibold text-blue-grey-700 dark:text-blue-grey-200">Your Answer</p>
			<p class="text-blue-grey-600 dark:text-blue-grey-300">
				{selectedKeys.length > 0 ? selectedKeys.join(', ') : 'Not answered'}
			</p>
		</div>
		<div class="rounded-lg bg-blue-grey-050 p-3 dark:bg-blue-grey-900">
			<p class="font-semibold text-blue-grey-700 dark:text-blue-grey-200">Correct Answer</p>
			<p class="text-blue-grey-600 dark:text-blue-grey-300">{correctKeys.join(', ')}</p>
		</div>
	</div>
{/if}

<div class="mt-4">
	<h3 class="font-semibold text-blue-grey-900 dark:text-white">Explanation</h3>
	<p class="mt-1 text-sm leading-relaxed text-blue-grey-700 dark:text-blue-grey-200">
		{explanation}
	</p>
</div>

{#if keyConcept}
	<div class="mt-3">
		<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">Key Concept</h3>
		<Badge color="primary" class="mt-1">{keyConcept}</Badge>
	</div>
{/if}

{#if reference}
	<div class="mt-3">
		<h3 class="text-sm font-semibold text-blue-grey-700 dark:text-blue-grey-200">Reference</h3>
		<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-300">{reference}</p>
	</div>
{/if}

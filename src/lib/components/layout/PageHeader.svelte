<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		backHref,
		backLabel = 'Back',
		centered = false,
		actions
	}: {
		title: string;
		subtitle?: string;
		backHref?: string;
		backLabel?: string;
		centered?: boolean;
		actions?: Snippet;
	} = $props();
</script>

{#if backHref}
	<div class="mb-1">
		<a
			href={backHref}
			class="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
		>
			← {backLabel}
		</a>
	</div>
{/if}

<div class={centered ? 'text-center' : 'flex flex-wrap items-end justify-between gap-3'}>
	<div class={centered ? '' : 'min-w-0'}>
		<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">{title}</h1>
		{#if subtitle}
			<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">{subtitle}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex flex-wrap gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
			{@render actions()}
		</div>
	{/if}
</div>

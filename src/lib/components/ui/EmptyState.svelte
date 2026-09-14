<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from 'flowbite-svelte';

	let {
		icon = '○',
		title,
		description,
		actionHref,
		actionLabel,
		variant = 'default',
		children
	}: {
		icon?: string;
		title: string;
		description: string;
		actionHref?: string;
		actionLabel?: string;
		variant?: 'default' | 'info';
		children?: Snippet;
	} = $props();
</script>

<div
	class="rounded-xl border border-blue-grey-200 bg-white p-8 text-center shadow-sm dark:border-blue-grey-700 dark:bg-blue-grey-800"
>
	<div
		class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl
			{variant === 'info'
			? 'bg-blue-050 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300'
			: 'bg-blue-grey-050 text-blue-grey-500 dark:bg-blue-grey-900 dark:text-blue-grey-300'}"
	>
		{icon}
	</div>
	<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">{title}</h2>
	<p class="mx-auto mt-1 max-w-md text-sm text-blue-grey-600 dark:text-blue-grey-200">
		{description}
	</p>
	{#if actionHref && actionLabel}
		<div class="mt-4 flex justify-center">
			<Button href={actionHref} color="primary">{actionLabel}</Button>
		</div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>

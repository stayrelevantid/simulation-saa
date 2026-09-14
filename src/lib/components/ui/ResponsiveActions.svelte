<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, centered = false }: { children: Snippet; centered?: boolean } = $props();
</script>

<div
	class="flex flex-col gap-2 {centered
		? 'justify-center'
		: 'max-sm:w-full sm:flex-row sm:items-center sm:justify-end sm:gap-3 max-sm:[&>*]:w-full'}"
>
	{@render children()}
</div>

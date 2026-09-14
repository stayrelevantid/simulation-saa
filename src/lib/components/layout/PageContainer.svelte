<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'wide',
		children
	}: { variant?: 'narrow' | 'reading' | 'wide' | 'full'; children: Snippet } = $props();

	const widths: Record<string, string> = {
		narrow: 'max-w-2xl',
		reading: 'max-w-4xl',
		wide: 'max-w-6xl',
		full: 'max-w-7xl'
	};
</script>

<div class="mx-auto w-full {widths[variant]} space-y-6">
	{@render children()}
</div>

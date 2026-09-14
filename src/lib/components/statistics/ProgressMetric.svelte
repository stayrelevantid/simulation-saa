<script lang="ts">
	let { name, accuracy, attempted }: { name: string; accuracy: number; attempted: number } =
		$props();

	function pct(value: number): string {
		return `${Math.round(value * 100)}%`;
	}

	let barColor = $derived(
		accuracy >= 0.8 ? 'bg-teal-500' : accuracy >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
	);
</script>

<div class="rounded-lg border border-blue-grey-100 p-3 dark:border-blue-grey-700">
	<div class="mb-1 flex items-center justify-between gap-2 text-sm">
		<span class="min-w-0 truncate font-medium text-blue-grey-800 dark:text-blue-grey-100">
			{name}
		</span>
		<span
			class="shrink-0 font-semibold {attempted > 0
				? 'text-blue-grey-900 dark:text-white'
				: 'text-blue-grey-400'}"
		>
			{attempted > 0 ? pct(accuracy) : '–'}
		</span>
	</div>
	<div class="h-2 w-full rounded-full bg-blue-grey-100 dark:bg-blue-grey-700">
		<div
			class="h-2 rounded-full {attempted > 0 ? barColor : ''}"
			style="width: {attempted > 0 ? Math.round(accuracy * 100) : 0}%"
		></div>
	</div>
	{#if attempted === 0}
		<p class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">no data yet</p>
	{/if}
</div>

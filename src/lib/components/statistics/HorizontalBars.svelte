<script lang="ts">
	import type { BarItem } from './chart-utils';
	import { pct } from './chart-utils';

	let { items, emptyMessage = 'No data yet.' }: { items: BarItem[]; emptyMessage?: string } =
		$props();

	const colorClasses: Record<BarItem['color'], string> = {
		teal: 'bg-teal-500',
		yellow: 'bg-yellow-500',
		red: 'bg-red-500',
		gray: 'bg-blue-grey-200 dark:bg-blue-grey-700'
	};

	function width(value: number): number {
		return Math.max(0, Math.min(100, value * 100));
	}
</script>

{#if items.length === 0}
	<p class="text-sm text-blue-grey-500 dark:text-blue-grey-300">{emptyMessage}</p>
{:else}
	<div class="space-y-4">
		{#each items as item (item.label)}
			<div>
				<div class="mb-1.5 flex items-baseline justify-between gap-2">
					<span
						class="min-w-0 truncate text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100"
						title={item.label}
					>
						{item.label}
					</span>
					<span
						class="shrink-0 text-sm font-semibold {item.color === 'gray'
							? 'text-blue-grey-400'
							: 'text-blue-grey-900 dark:text-white'}"
					>
						{item.color === 'gray' ? '–' : pct(item.value)}
					</span>
				</div>
				<div
					class="h-2.5 w-full overflow-hidden rounded-full bg-blue-grey-100 dark:bg-blue-grey-700"
				>
					{#if item.color !== 'gray'}
						<div
							class="h-full rounded-full transition-all duration-700 ease-out {colorClasses[
								item.color
							]}"
							style="width: {width(item.value)}%"
						></div>
					{/if}
				</div>
				{#if item.attempts !== undefined}
					<p
						class="mt-1 text-xs {item.color === 'gray'
							? 'text-blue-grey-400'
							: 'text-blue-grey-500 dark:text-blue-grey-300'}"
					>
						{item.attempts === 0 ? 'no data' : `${item.attempts} attempted`}
					</p>
				{/if}
			</div>
		{/each}
	</div>
{/if}

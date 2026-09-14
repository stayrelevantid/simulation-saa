<script lang="ts">
	let {
		label,
		value,
		hint,
		color = 'neutral',
		centered = true
	}: {
		label: string;
		value: string | number;
		hint?: string;
		color?: 'neutral' | 'teal' | 'blue' | 'purple' | 'red' | 'yellow';
		centered?: boolean;
	} = $props();

	const colorClasses: Record<string, string> = {
		neutral: 'text-blue-grey-800 dark:text-blue-grey-100',
		teal: 'text-teal-600 dark:text-teal-300',
		blue: 'text-blue-600 dark:text-blue-300',
		purple: 'text-purple-600 dark:text-purple-300',
		red: 'text-red-600 dark:text-red-300',
		yellow: 'text-yellow-600 dark:text-yellow-300'
	};
</script>

<div
	class="rounded-xl border border-blue-grey-100 bg-white p-5 shadow-sm dark:border-blue-grey-700 dark:bg-blue-grey-800 {centered
		? 'text-center'
		: ''}"
>
	<div class="text-sm font-medium text-blue-grey-500 dark:text-blue-grey-300">{label}</div>
	<div class="mt-1 text-3xl font-bold {colorClasses[color]}">{value}</div>
	{#if hint}
		<div class="mt-1 text-xs text-blue-grey-400 dark:text-blue-grey-300">{hint}</div>
	{/if}
</div>

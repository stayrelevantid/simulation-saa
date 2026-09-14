<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'default',
		padding = 'default',
		class: className = '',
		children
	}: {
		variant?: 'default' | 'highlighted' | 'warning' | 'success' | 'danger' | 'info';
		padding?: 'none' | 'default' | 'large';
		class?: string;
		children: Snippet;
	} = $props();

	const variantClasses: Record<string, string> = {
		default: 'border-blue-grey-100 bg-white dark:border-blue-grey-700 dark:bg-blue-grey-800',
		highlighted: 'border-teal-300 bg-white dark:border-teal-800 dark:bg-blue-grey-800',
		warning: 'border-yellow-300 bg-yellow-050 dark:border-yellow-700 dark:bg-yellow-900/30',
		success: 'border-teal-300 bg-teal-050 dark:border-teal-700 dark:bg-teal-900/30',
		danger: 'border-red-300 bg-red-050 dark:border-red-700 dark:bg-red-900/30',
		info: 'border-blue-300 bg-blue-050 dark:border-blue-700 dark:bg-blue-900/30'
	};

	const paddingClasses: Record<string, string> = {
		none: '',
		default: 'p-5 sm:p-6',
		large: 'p-6 sm:p-8'
	};
</script>

<div
	class="rounded-xl border shadow-sm {variantClasses[variant]} {paddingClasses[
		padding
	]} {className}"
>
	{@render children()}
</div>

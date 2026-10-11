<script lang="ts">
	import { Button } from 'flowbite-svelte';

	let {
		services,
		selected = [],
		onchange
	}: {
		services: { serviceName: string; count: number }[];
		selected?: string[];
		onchange?: (services: string[]) => void;
	} = $props();

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return services;
		return services.filter((s) => s.serviceName.toLowerCase().includes(q));
	});

	const isAuto = $derived(selected.length === 0);

	function toggle(serviceName: string) {
		const next = selected.includes(serviceName)
			? selected.filter((s) => s !== serviceName)
			: [...selected, serviceName];
		onchange?.(next);
	}

	function clearAll() {
		query = '';
		onchange?.([]);
	}
</script>

<div class="space-y-3">
	<div class="flex flex-wrap items-center gap-2">
		<Button
			size="xs"
			color={isAuto ? 'primary' : 'gray'}
			outline={!isAuto}
			onclick={clearAll}
			aria-pressed={isAuto}
		>
			All Services
		</Button>
		{#if !isAuto}
			<span class="text-xs text-blue-grey-500 dark:text-blue-grey-300">
				{selected.length} selected
			</span>
		{/if}
	</div>

	{#if selected.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selected as service (service)}
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-full border border-teal-300 bg-teal-050 px-2.5 py-1 text-xs font-medium text-teal-800 transition-colors hover:bg-teal-100 dark:border-teal-700 dark:bg-teal-900/40 dark:text-teal-200"
					onclick={() => toggle(service)}
					aria-label="Remove {service}"
				>
					{service}
					<span aria-hidden="true">×</span>
				</button>
			{/each}
		</div>
	{/if}

	<div>
		<input
			type="text"
			bind:value={query}
			placeholder="Search AWS services…"
			class="w-full rounded-lg border border-blue-grey-300 bg-blue-grey-050 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-300 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:text-blue-grey-100"
		/>
		<div
			class="mt-2 max-h-40 overflow-y-auto rounded-lg border border-blue-grey-200 p-2 dark:border-blue-grey-700"
			role="group"
			aria-label="AWS services"
		>
			{#if services.length === 0}
				<p class="p-2 text-xs text-blue-grey-500 dark:text-blue-grey-300">
					No AWS services in the question bank yet.
				</p>
			{:else if filtered.length === 0}
				<p class="p-2 text-xs text-blue-grey-500 dark:text-blue-grey-300">
					No services match “{query}”.
				</p>
			{:else}
				<div class="flex flex-wrap gap-1.5">
					{#each filtered as service (service.serviceName)}
						<button
							type="button"
							role="checkbox"
							aria-checked={selected.includes(service.serviceName)}
							class="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors {selected.includes(
								service.serviceName
							)
								? 'border-teal-500 bg-teal-050 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
								: 'border-blue-grey-200 text-blue-grey-600 hover:border-teal-300 dark:border-blue-grey-600 dark:text-blue-grey-300'}"
							onclick={() => toggle(service.serviceName)}
						>
							{service.serviceName}
							<span class="text-blue-grey-400">· {service.count}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<p class="text-xs text-blue-grey-500 dark:text-blue-grey-300">
		Leave empty (All Services) to practice across every AWS service.
	</p>
</div>

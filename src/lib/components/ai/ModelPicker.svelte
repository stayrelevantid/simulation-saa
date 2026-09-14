<script lang="ts">
	import { Button, Spinner } from 'flowbite-svelte';
	import { filterModels, groupModels, pickDefaultModel, RECOMMENDED_MODELS } from './model-utils';
	import type { AIModel } from '$lib/ai/provider';

	let {
		models,
		selected = '',
		modelsError = '',
		loading = false,
		onRetry,
		onselect
	}: {
		models: AIModel[];
		selected?: string;
		modelsError?: string;
		loading?: boolean;
		onRetry?: () => void;
		onselect?: (id: string) => void;
	} = $props();

	let query = $state('');
	let open = $state(false);
	let dropdown: HTMLDivElement | undefined;
	let selectedProvider = $state('');

	const modelIds = $derived(models.map((m) => m.id));
	const providers = $derived(groupModels(models));

	// Up to 4 recommended chips that actually exist in the loaded model list
	const recommended = $derived(
		RECOMMENDED_MODELS.filter((id) => modelIds.includes(id)).slice(0, 4)
	);

	const filtered = $derived(
		filterModels(modelIds, query, selectedProvider || undefined).slice(0, 30)
	);

	// Pick a sensible default once models arrive (parent uses onselect to own state)
	$effect(() => {
		if (!selected && modelIds.length > 0) {
			onselect?.(pickDefaultModel(modelIds));
		}
	});

	function select(id: string) {
		onselect?.(id);
		query = '';
		open = false;
	}

	function toggleOpen() {
		if (loading) return;
		open = !open;
		query = '';
	}

	function onInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (filtered.length > 0) select(filtered[0].id);
		} else if (event.key === 'Escape') {
			open = false;
		}
	}

	function onClickOutside(event: MouseEvent) {
		if (dropdown && !dropdown.contains(event.target as Node)) {
			open = false;
		}
	}

	function applyProviderFilter(provider: string) {
		selectedProvider = selectedProvider === provider ? '' : provider;
	}
</script>

<svelte:window onclick={onClickOutside} />

<div class="space-y-3">
	<div class="relative" bind:this={dropdown}>
		{#if loading}
			<div
				class="flex h-11 items-center gap-2 rounded-lg border border-blue-grey-200 bg-blue-grey-050 px-3 text-sm text-blue-grey-500 dark:border-blue-grey-700 dark:bg-blue-grey-900 dark:text-blue-grey-300"
			>
				<Spinner size="4" /> Loading models...
			</div>
		{:else if modelsError}
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
					<span>⚠</span>
					<span class="min-w-0">{modelsError}</span>
				</div>
				{#if onRetry}
					<Button size="sm" color="red" outline onclick={onRetry}>Retry</Button>
				{/if}
			</div>
		{:else}
			<div
				class="flex h-11 cursor-pointer items-center justify-between rounded-lg border border-blue-grey-300 bg-blue-grey-050 px-3 transition-colors hover:border-teal-400 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:hover:border-teal-600"
				onclick={toggleOpen}
				role="button"
				tabindex="0"
				aria-haspopup="listbox"
				aria-expanded={open}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						toggleOpen();
					}
				}}
			>
				{#if selected}
					<span class="truncate text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						{selected}
					</span>
				{:else}
					<span class="text-sm text-blue-grey-400 dark:text-blue-grey-400">Select a model…</span>
				{/if}
				<span class="ml-2 shrink-0 text-blue-grey-400">{open ? '▲' : '▼'}</span>
			</div>

			{#if open}
				<div
					class="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-blue-grey-200 bg-white shadow-lg dark:border-blue-grey-700 dark:bg-blue-grey-800"
				>
					<div
						class="flex flex-wrap items-center gap-1 border-b border-blue-grey-100 p-2 dark:border-blue-grey-700"
					>
						{#each providers.slice(0, 8) as provider (provider.id)}
							<button
								type="button"
								class="rounded-full border px-2 py-0.5 text-xs font-medium transition-colors {selectedProvider ===
								provider.id
									? 'border-teal-500 bg-teal-050 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200'
									: 'border-blue-grey-200 text-blue-grey-600 hover:border-teal-300 dark:border-blue-grey-600 dark:text-blue-grey-300'}"
								onclick={() => applyProviderFilter(provider.id)}
							>
								{provider.name} ({provider.count})
							</button>
						{/each}
					</div>

					<div class="p-2">
						<input
							type="text"
							bind:value={query}
							placeholder="Filter models…"
							class="w-full rounded-lg border border-blue-grey-300 bg-blue-grey-050 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-300 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:text-blue-grey-100"
							onkeydown={onInputKeydown}
						/>
					</div>

					<div class="max-h-56 overflow-y-auto p-1" role="listbox" aria-label="Available models">
						{#if filtered.length === 0}
							<p class="p-3 text-sm text-blue-grey-500 dark:text-blue-grey-300">
								No models match “{query}”.
							</p>
						{:else}
							{#each filtered as model (model.id)}
								<button
									type="button"
									role="option"
									aria-selected={selected === model.id}
									class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors {selected ===
									model.id
										? 'bg-teal-050 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
										: 'text-blue-grey-700 hover:bg-blue-grey-050 dark:text-blue-grey-200 dark:hover:bg-blue-grey-900'}"
									onclick={() => select(model.id)}
								>
									<span class="truncate">{model.name}</span>
									<span class="shrink-0 text-xs text-blue-grey-400">{model.provider}</span>
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>

	{#if !loading && !modelsError}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs font-medium text-blue-grey-500 dark:text-blue-grey-300"
				>Recommended:</span
			>
			{#each recommended as id (id)}
				<Button
					size="xs"
					color={selected === id ? 'primary' : 'gray'}
					outline={selected !== id}
					onclick={() => select(id)}
				>
					{id}
				</Button>
			{/each}
		</div>
	{/if}
</div>

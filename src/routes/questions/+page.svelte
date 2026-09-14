<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating } from '$app/state';
	import { resolve } from '$app/paths';
	import { Badge, Button, Input, Label, PaginationNav, Select, Spinner } from 'flowbite-svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import QuestionCard from '$lib/components/question/QuestionCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const questions = $derived(data.questions);
	const totalPages = $derived(data.totalPages);
	const pageSize = $derived(data.pageSize);
	const rangeStart = $derived((data.page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(data.page * pageSize, data.total));
	const isNavigating = $derived(
		(navigating?.from ?? null) !== null || (navigating?.to ?? null) !== null
	);

	let search = $state('');
	let domain = $state('');
	let difficulty = $state('');
	let type = $state('');
	let service = $state('');

	// Keep local filter state in sync with the URL (server is the source of truth)
	$effect(() => {
		search = data.currentFilters.search;
		domain = data.currentFilters.domain;
		difficulty = data.currentFilters.difficulty;
		type = data.currentFilters.type;
		service = data.currentFilters.service;
	});

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	const activeFilters = $derived(
		[
			{ key: 'search', label: `Search: "${search}"`, value: search },
			{ key: 'domain', label: domain ? domainLabel(domain) : '', value: domain },
			{
				key: 'difficulty',
				label: difficulty ? difficultyLabel(difficulty) : '',
				value: difficulty
			},
			{ key: 'type', label: type ? typeLabel(type) : '', value: type },
			{ key: 'service', label: service, value: service }
		].filter((f) => f.value !== '')
	);

	function domainLabel(value: string): string {
		return data.domains.find((d) => String(d.id) === value)?.name ?? value;
	}

	function difficultyLabel(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	function typeLabel(value: string): string {
		return value === 'single' ? 'Single Choice' : 'Multiple Response';
	}

	function navigate(next: Partial<Record<string, string>> = {}, page?: number) {
		const merged = { search, domain, difficulty, type, service, ...next };

		// Reflect the change locally so the UI feels instant
		search = merged.search ?? '';
		domain = merged.domain ?? '';
		difficulty = merged.difficulty ?? '';
		type = merged.type ?? '';
		service = merged.service ?? '';

		const params = new SvelteURLSearchParams();
		for (const [key, value] of Object.entries(merged)) {
			if (value) params.set(key, value);
		}
		if (page && page > 1) params.set('page', String(page));

		const qs = params.toString();
		goto(qs ? `/questions?${qs}` : '/questions', { keepFocus: true, noScroll: true });
	}

	function onSearchInput(value: string) {
		search = value;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => navigate({ search: value }), 400);
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		clearTimeout(debounceTimer);
		navigate({ search });
	}

	function resetFilters() {
		clearTimeout(debounceTimer);
		search = '';
		domain = '';
		difficulty = '';
		type = '';
		service = '';
		goto('/questions', { noScroll: true });
	}

	async function toggleBookmark(questionId: number) {
		const body = new SvelteURLSearchParams({ questionId: String(questionId) });
		await fetch('/questions?/toggleBookmark', { method: 'POST', body });
		await invalidateAll();
	}
</script>

<PageContainer variant="wide">
	<PageHeader
		title="Question Bank"
		subtitle="Browse, filter, and bookmark {data.total} questions from your bank."
	>
		{#snippet actions()}
			<Button href={resolve('/questions/import')} color="primary" size="sm">
				Import Question Bank
			</Button>
		{/snippet}
	</PageHeader>

	<div class="mx-auto w-full max-w-3xl">
		<SectionCard>
			<div class="mb-5 flex flex-wrap items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<h2 class="text-base font-semibold text-blue-grey-900 dark:text-white">Filters</h2>
					{#if activeFilters.length > 0}
						<Badge color="primary">{activeFilters.length} active</Badge>
					{/if}
				</div>
				{#if activeFilters.length > 0}
					<Button size="sm" color="primary" outline onclick={resetFilters}>Reset all</Button>
				{/if}
			</div>

			<form class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onsubmit={submitSearch}>
				<div class="sm:col-span-2">
					<Label for="search" class="mb-2 block text-sm font-medium">Search</Label>
					<div class="flex gap-2">
						<Input
							id="search"
							value={search}
							oninput={(e) => onSearchInput((e.currentTarget as HTMLInputElement).value)}
							placeholder="Search questions..."
							class="flex-1"
						/>
						<Button type="submit" color="primary" class="shrink-0" disabled={isNavigating}>
							{#if isNavigating}
								<Spinner size="4" />
							{:else}
								Search
							{/if}
						</Button>
					</div>
				</div>

				<div>
					<Label for="domain" class="mb-2 block text-sm font-medium">Domain</Label>
					<Select
						id="domain"
						value={domain}
						onchange={(e) => navigate({ domain: e.currentTarget.value })}
					>
						<option value="">All Domains</option>
						{#each data.domains as d (d.id)}
							<option value={String(d.id)}>{d.name}</option>
						{/each}
					</Select>
				</div>

				<div>
					<Label for="difficulty" class="mb-2 block text-sm font-medium">Difficulty</Label>
					<Select
						id="difficulty"
						value={difficulty}
						onchange={(e) => navigate({ difficulty: e.currentTarget.value })}
					>
						<option value="">All Levels</option>
						<option value="easy">Easy</option>
						<option value="medium">Medium</option>
						<option value="hard">Hard</option>
					</Select>
				</div>

				<div>
					<Label for="type" class="mb-2 block text-sm font-medium">Question Type</Label>
					<Select
						id="type"
						value={type}
						onchange={(e) => navigate({ type: e.currentTarget.value })}
					>
						<option value="">All Types</option>
						<option value="single">Single Choice</option>
						<option value="multiple">Multiple Response</option>
					</Select>
				</div>

				<div class="sm:col-span-2">
					<Label for="service" class="mb-2 block text-sm font-medium">AWS Service</Label>
					<Select
						id="service"
						value={service}
						onchange={(e) => navigate({ service: e.currentTarget.value })}
					>
						<option value="">All Services</option>
						{#each data.services as s (s)}
							<option value={s}>{s}</option>
						{/each}
					</Select>
				</div>
			</form>

			{#if activeFilters.length > 0}
				<div
					class="mt-5 flex flex-wrap items-center gap-2 border-t border-blue-grey-100 pt-4 dark:border-blue-grey-700"
				>
					<span class="text-xs font-medium text-blue-grey-500 dark:text-blue-grey-300">
						Active:
					</span>
					{#each activeFilters as filter (filter.key)}
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-full border border-blue-grey-200 bg-blue-grey-050 px-3 py-1 text-xs font-medium text-blue-grey-700 transition-colors hover:border-teal-400 hover:text-teal-700 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:text-blue-grey-200 dark:hover:border-teal-600 dark:hover:text-teal-300"
							onclick={() => navigate({ [filter.key]: '' })}
							aria-label="Remove filter {filter.label}"
						>
							{filter.label}
							<span aria-hidden="true">×</span>
						</button>
					{/each}
					<Button size="xs" color="primary" outline onclick={resetFilters}>Clear all</Button>
				</div>
			{/if}
		</SectionCard>
	</div>

	<div class="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
		<p class="text-sm text-blue-grey-600 dark:text-blue-grey-300">
			{#if data.total > 0}
				Showing
				<span class="font-semibold text-blue-grey-900 dark:text-white">{rangeStart}–{rangeEnd}</span
				>
				of <span class="font-semibold text-blue-grey-900 dark:text-white">{data.total}</span>
				questions
			{:else}
				No questions found
			{/if}
		</p>
		{#if isNavigating}
			<span class="flex items-center gap-2 text-xs text-blue-grey-500 dark:text-blue-grey-300">
				<Spinner size="4" /> Updating...
			</span>
		{/if}
	</div>

	{#if questions.length === 0}
		<div class="mx-auto w-full max-w-3xl">
			<EmptyState
				icon="🔍"
				title="No questions match your filters"
				description="Try a different search term or broaden your filters to find questions in the bank."
				actionHref={resolve('/questions')}
				actionLabel="Clear Filters"
			/>
		</div>
	{:else}
		<div class="mx-auto grid w-full max-w-3xl gap-5">
			{#each questions as question (question.id)}
				<QuestionCard {question} onToggleBookmark={toggleBookmark} />
			{/each}
		</div>
	{/if}

	{#if totalPages > 1}
		<div class="mx-auto flex w-full max-w-3xl flex-col items-center gap-2">
			<PaginationNav
				currentPage={data.page}
				{totalPages}
				layout="navigation"
				onPageChange={(page: number) => navigate({}, page)}
			/>
			<p class="text-xs text-blue-grey-400 dark:text-blue-grey-400">
				Page {data.page} of {totalPages}
			</p>
		</div>
	{:else if data.total > 0}
		<p
			class="mx-auto w-full max-w-3xl text-center text-xs text-blue-grey-400 dark:text-blue-grey-400"
		>
			Page 1 of 1
		</p>
	{/if}
</PageContainer>

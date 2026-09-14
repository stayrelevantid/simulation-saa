<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { Button, Card, Select, Input, Label, PaginationNav } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import QuestionCard from '$lib/components/question/QuestionCard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let search = $derived(data.currentFilters.search);

	const questions = $derived(data.questions);
	const totalPages = $derived(data.totalPages);
	const pageSize = $derived(data.pageSize);
	const rangeStart = $derived((data.page - 1) * pageSize + 1);
	const rangeEnd = $derived(Math.min(data.page * pageSize, data.total));

	function buildUrl(overrides: Record<string, string | number | undefined>) {
		const params = new SvelteURLSearchParams();
		const values = {
			domain: data.currentFilters.domain,
			difficulty: data.currentFilters.difficulty,
			type: data.currentFilters.type,
			service: data.currentFilters.service,
			search,
			...overrides
		};
		for (const [key, value] of Object.entries(values)) {
			if (value !== undefined && value !== '' && value !== null) {
				params.set(key, String(value));
			}
		}
		const qs = params.toString();
		return qs ? `/questions?${qs}` : '/questions';
	}

	function applyFilters() {
		const params = new SvelteURLSearchParams();
		if (data.currentFilters.domain) params.set('domain', data.currentFilters.domain);
		if (data.currentFilters.difficulty) params.set('difficulty', data.currentFilters.difficulty);
		if (data.currentFilters.type) params.set('type', data.currentFilters.type);
		if (data.currentFilters.service) params.set('service', data.currentFilters.service);
		if (search) params.set('search', search);
		const qs = params.toString();
		window.location.href = qs ? `/questions?${qs}` : '/questions';
	}

	async function toggleBookmark(questionId: number) {
		await fetch('/questions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new SvelteURLSearchParams({ action: 'toggleBookmark', questionId: String(questionId) })
		});
		window.location.reload();
	}
</script>

<div class="mx-auto max-w-5xl space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">Question Bank</h1>
		<Button href={resolve('/questions/import')} color="primary" size="sm">
			Import Question Bank
		</Button>
	</div>

	<Card
		class="rounded-xl border-blue-grey-100 bg-blue-grey-050 shadow-sm dark:border-blue-grey-700 dark:bg-blue-grey-900"
	>
		<form
			class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
			onsubmit={(e) => {
				e.preventDefault();
				applyFilters();
			}}
		>
			<div>
				<Label for="search" class="mb-1 block text-xs">Search</Label>
				<Input id="search" bind:value={search} placeholder="Search questions..." />
			</div>
			<div>
				<Label for="domain" class="mb-1 block text-xs">Domain</Label>
				<Select id="domain" bind:value={data.currentFilters.domain} onchange={applyFilters}>
					<option value="">All Domains</option>
					{#each data.domains as domain (domain.id)}
						<option value={String(domain.id)}>{domain.name}</option>
					{/each}
				</Select>
			</div>
			<div>
				<Label for="difficulty" class="mb-1 block text-xs">Difficulty</Label>
				<Select id="difficulty" bind:value={data.currentFilters.difficulty} onchange={applyFilters}>
					<option value="">All Levels</option>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</Select>
			</div>
			<div>
				<Label for="type" class="mb-1 block text-xs">Question Type</Label>
				<Select id="type" bind:value={data.currentFilters.type} onchange={applyFilters}>
					<option value="">All Types</option>
					<option value="single">Multiple Choice</option>
					<option value="multiple">Multiple Response</option>
				</Select>
			</div>
			<div>
				<Label for="service" class="mb-1 block text-xs">AWS Service</Label>
				<Select id="service" bind:value={data.currentFilters.service} onchange={applyFilters}>
					<option value="">All Services</option>
					{#each data.services as service (service)}
						<option value={service}>{service}</option>
					{/each}
				</Select>
			</div>
		</form>
	</Card>

	<p class="text-sm text-blue-grey-600 dark:text-blue-grey-300">
		{#if data.total > 0}
			Showing <span class="font-semibold text-blue-grey-900 dark:text-white">
				{rangeStart}–{rangeEnd}
			</span>
			of
			<span class="font-semibold text-blue-grey-900 dark:text-white">{data.total}</span>
			questions · Page {data.page} of {totalPages}
		{:else}
			No questions match your filters.
		{/if}
	</p>

	{#each questions as question (question.id)}
		<QuestionCard {question} onToggleBookmark={toggleBookmark} />
	{/each}

	{#if questions.length === 0}
		<div
			class="rounded-lg border border-blue-grey-200 p-8 text-center text-blue-grey-500 dark:border-blue-grey-700 dark:text-blue-grey-300"
		>
			Try adjusting your search or filters to find questions.
		</div>
	{/if}

	{#if totalPages > 1}
		<div class="flex justify-center">
			<PaginationNav
				currentPage={data.page}
				{totalPages}
				layout="navigation"
				onPageChange={(page: number) => (window.location.href = buildUrl({ page }))}
			/>
		</div>
	{:else if data.total > 0}
		<p class="text-center text-xs text-blue-grey-400 dark:text-blue-grey-400">Page 1 of 1</p>
	{/if}
</div>

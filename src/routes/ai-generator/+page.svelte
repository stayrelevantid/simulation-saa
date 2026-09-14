<script lang="ts">
	import {
		Alert,
		Badge,
		Button,
		Card,
		Checkbox,
		Input,
		Label,
		Select,
		Spinner
	} from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import type { PageProps } from './$types';
	import type { AIModel, GeneratedQuestion } from '$lib/ai/provider';

	let { data }: PageProps = $props();

	let models = $state<AIModel[]>([]);
	let modelsError = $state('');
	let loadingModels = $state(false);
	let selectedModel = $state('');
	let questionCount = $state(20);
	let difficulty = $state<string[]>(['medium', 'hard']);
	let questionTypes = $state<string[]>(['single', 'multiple']);
	let selectedDomains = $state<string[]>([]);
	let awsServices = $state('');
	let generating = $state(false);
	let generateError = $state('');

	let rawQuestions = $state<GeneratedQuestion[]>([]);
	let validQuestions = $state<GeneratedQuestion[]>([]);
	let needReview = $state<{ question: GeneratedQuestion; issues: string[] }[]>([]);
	let validating = $state(false);

	let importing = $state(false);
	let importResult = $state<{ importedCount: number; skippedCount: number } | null>(null);

	let previewIndex = $state(0);
	let previewSource = $state<'valid' | 'review'>('valid');

	onMount(async () => {
		loadingModels = true;
		try {
			const response = await fetch('/api/ai/models');
			const payload = await response.json();
			if (response.ok) {
				models = payload.models ?? [];
				if (models.length > 0) selectedModel = models[0].id;
			} else {
				modelsError = payload.error ?? 'Failed to load models';
			}
		} catch {
			modelsError = 'Unable to connect to OpenCode Go.';
		} finally {
			loadingModels = false;
		}
	});

	async function generate() {
		generating = true;
		generateError = '';
		rawQuestions = [];
		validQuestions = [];
		needReview = [];
		importResult = null;
		previewIndex = 0;
		previewSource = 'valid';

		try {
			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: selectedModel,
					questionCount,
					difficulty,
					questionTypes,
					domains: selectedDomains,
					awsServices: awsServices
						.split(',')
						.map((s) => s.trim())
						.filter(Boolean)
				})
			});
			const payload = await response.json();
			if (response.ok) {
				rawQuestions = payload.questions ?? [];
				await validate();
			} else {
				generateError = payload.error ?? 'Generation failed';
			}
		} catch {
			generateError = 'Unable to connect to OpenCode Go.';
		} finally {
			generating = false;
		}
	}

	async function validate() {
		if (rawQuestions.length === 0) return;
		validating = true;
		previewIndex = 0;
		previewSource = 'valid';

		try {
			const response = await fetch('/api/ai/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ questions: rawQuestions })
			});
			const payload = await response.json();
			if (response.ok) {
				validQuestions = payload.validQuestions ?? [];
				needReview = payload.needReview ?? [];
			} else {
				generateError = payload.error ?? 'Validation failed';
			}
		} catch {
			generateError = 'Validation request failed.';
		} finally {
			validating = false;
		}
	}

	async function importValid() {
		if (validQuestions.length === 0) return;
		importing = true;

		try {
			const response = await fetch('/api/ai/import', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ questions: validQuestions })
			});
			const payload = await response.json();
			if (response.ok) {
				importResult = {
					importedCount: payload.importedCount,
					skippedCount: payload.skippedCount
				};
				validQuestions = [];
				needReview = [];
				rawQuestions = [];
			} else {
				generateError = payload.error ?? 'Import failed';
			}
		} catch {
			generateError = 'Import request failed.';
		} finally {
			importing = false;
		}
	}

	function cancel() {
		rawQuestions = [];
		validQuestions = [];
		needReview = [];
		importResult = null;
		generateError = '';
	}

	const previewList = $derived(
		previewSource === 'valid' ? validQuestions : needReview.map((r) => r.question)
	);
	const currentPreview = $derived(previewList[previewIndex] ?? null);
	const currentIssues = $derived(
		previewSource === 'review' ? (needReview[previewIndex]?.issues ?? []) : []
	);
</script>

<PageContainer variant="reading">
	<PageHeader
		title="AI Question Generator"
		subtitle="Generate original scenario-based SAA-C03 questions with OpenCode Go."
	/>

	<Card>
		<form
			class="space-y-5"
			onsubmit={(e) => {
				e.preventDefault();
				generate();
			}}
		>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label class="mb-1 block">Exam Profile</Label>
					<Input value="SAA-C03" disabled />
				</div>
				<div>
					<Label class="mb-1 block">AI Model</Label>
					{#if loadingModels}
						<div class="flex items-center gap-2 text-sm text-blue-grey-500">
							<Spinner size="4" /> Loading models...
						</div>
					{:else if modelsError}
						<Select disabled>
							<option>Model unavailable</option>
						</Select>
					{:else}
						<Select bind:value={selectedModel}>
							{#each models as model (model.id)}
								<option value={model.id}>{model.id}</option>
							{/each}
						</Select>
					{/if}
				</div>
			</div>

			{#if modelsError}
				<Alert color="red">
					{modelsError}
					<span class="mt-1 block text-xs">
						Check: OpenCode Go is running, base URL is correct, API key is set, and the selected
						model is available.
					</span>
				</Alert>
			{/if}

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label class="mb-1 block">Question Count (1-50)</Label>
					<Input type="number" bind:value={questionCount} min="1" max="50" />
				</div>
				<div>
					<Label class="mb-1 block">AWS Services (comma-separated, optional)</Label>
					<Input bind:value={awsServices} placeholder="Auto" />
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<Label class="mb-2 block">Question Type</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={questionTypes} value="single">Multiple Choice</Checkbox>
						<Checkbox bind:group={questionTypes} value="multiple">Multiple Response</Checkbox>
					</div>
				</div>
				<div>
					<Label class="mb-2 block">Difficulty</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={difficulty} value="easy">Easy</Checkbox>
						<Checkbox bind:group={difficulty} value="medium">Medium</Checkbox>
						<Checkbox bind:group={difficulty} value="hard">Hard</Checkbox>
					</div>
				</div>
			</div>

			<div>
				<Label class="mb-2 block">Domain</Label>
				<div class="grid gap-2 sm:grid-cols-2">
					{#each data.domains as domain (domain.id)}
						<Checkbox
							bind:group={selectedDomains}
							value={domain.name.toLowerCase().replace(/[^a-z]+/g, '_')}
						>
							{domain.name}
						</Checkbox>
					{/each}
				</div>
			</div>

			<Button type="submit" color="primary" disabled={generating || !selectedModel} class="w-full">
				{generating ? 'Generating...' : 'Generate Questions'}
			</Button>
		</form>
	</Card>

	{#if generateError}
		<Alert color="red">{generateError}</Alert>
	{/if}

	{#if importResult}
		<Alert color="green">
			<span class="font-medium">Import complete.</span>
			{importResult.importedCount} questions imported into the Question Bank
			{importResult.skippedCount > 0 ? `, ${importResult.skippedCount} skipped (duplicates).` : '.'}
			<span class="ml-1 underline">
				<a href="/questions">View Question Bank</a>
			</span>
		</Alert>
	{/if}

	{#if generating || validating}
		<Card>
			<div
				class="flex items-center justify-center gap-3 p-6 text-blue-grey-500 dark:text-blue-grey-300"
			>
				<Spinner size="6" />
				{generating
					? 'Generating questions via OpenCode Go...'
					: 'Validating generated questions...'}
			</div>
		</Card>
	{/if}

	{#if !generating && !validating && (validQuestions.length > 0 || needReview.length > 0)}
		<Card>
			<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">
					{rawQuestions.length} Questions Generated
				</h2>
				<div class="flex gap-2">
					<Badge color="primary">✓ {validQuestions.length} Valid</Badge>
					{#if needReview.length > 0}
						<Badge color="yellow">⚠ {needReview.length} Need Review</Badge>
					{/if}
				</div>
			</div>

			{#if needReview.length > 0}
				<div class="mb-4 flex flex-wrap gap-2">
					<Button
						size="sm"
						color={previewSource === 'valid' ? 'primary' : 'gray'}
						outline={previewSource !== 'valid'}
						onclick={() => {
							previewSource = 'valid';
							previewIndex = 0;
						}}
					>
						Valid ({validQuestions.length})
					</Button>
					<Button
						size="sm"
						color={previewSource === 'review' ? 'yellow' : 'gray'}
						outline={previewSource !== 'review'}
						onclick={() => {
							previewSource = 'review';
							previewIndex = 0;
						}}
					>
						Need Review ({needReview.length})
					</Button>
				</div>
			{/if}

			<div class="mb-4 flex gap-1 overflow-x-auto pb-1">
				{#each previewList as q, i (q.question + i)}
					<button
						type="button"
						class="h-8 w-8 rounded text-xs font-medium {previewIndex === i
							? 'bg-blue-600 text-white'
							: 'bg-blue-grey-100 text-blue-grey-600 hover:bg-blue-grey-200 dark:bg-blue-grey-700 dark:text-blue-grey-200'}"
						onclick={() => (previewIndex = i)}
					>
						{i + 1}
					</button>
				{/each}
			</div>

			{#if currentIssues.length > 0}
				<Alert color="yellow" class="mb-4">
					<span class="font-medium">Issues:</span>
					<ul class="mt-1 list-inside list-disc text-xs">
						{#each currentIssues as issue (issue)}
							<li>{issue}</li>
						{/each}
					</ul>
				</Alert>
			{/if}

			{#if currentPreview}
				<div class="space-y-3">
					<div class="flex flex-wrap items-center gap-2">
						<Badge
							color={currentPreview.difficulty === 'easy'
								? 'green'
								: currentPreview.difficulty === 'medium'
									? 'yellow'
									: 'red'}
						>
							{currentPreview.difficulty}
						</Badge>
						<Badge color="blue">{currentPreview.domain}</Badge>
						<Badge color="gray"
							>{currentPreview.type === 'single' ? 'Multiple Choice' : 'Multiple Response'}</Badge
						>
						{#each currentPreview.services as service (service)}
							<Badge color="purple" size="small">{service}</Badge>
						{/each}
					</div>

					<p class="whitespace-pre-line text-blue-grey-900 dark:text-white">
						{currentPreview.question}
					</p>

					<div class="space-y-2">
						{#each currentPreview.options as option (option.key)}
							<div
								class="rounded-lg border p-3 {option.correct
									? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/40'
									: 'border-blue-grey-200 dark:border-blue-grey-700'}"
							>
								<span class="font-bold">{option.key}.</span>
								<span class="ml-1">{option.text}</span>
								{#if option.correct}
									<Badge color="green" class="float-right">Correct</Badge>
								{/if}
								<p class="mt-1 pl-5 text-xs text-blue-grey-600 dark:text-blue-grey-300">
									{option.explanation}
								</p>
							</div>
						{/each}
					</div>

					<div class="rounded-lg bg-blue-grey-050 p-3 text-sm dark:bg-blue-grey-900">
						<p class="font-semibold text-blue-grey-700 dark:text-blue-grey-200">Explanation</p>
						<p class="text-blue-grey-600 dark:text-blue-grey-300">{currentPreview.explanation}</p>
						{#if currentPreview.keyConcept}
							<p class="mt-2"><strong>Key Concept:</strong> {currentPreview.keyConcept}</p>
						{/if}
						{#if currentPreview.reference}
							<p class="mt-1 text-xs text-blue-grey-500">
								<strong>Reference:</strong>
								{currentPreview.reference}
							</p>
						{/if}
					</div>
				</div>
			{/if}

			<div class="mt-5 flex flex-wrap justify-end gap-2">
				<Button color="primary" outline onclick={cancel}>Cancel</Button>
				<Button color="blue" outline onclick={generate} disabled={generating}>Regenerate All</Button
				>
				<Button
					color="green"
					onclick={importValid}
					disabled={importing || validQuestions.length === 0}
				>
					{importing ? 'Importing...' : `Import ${validQuestions.length} Valid Questions`}
				</Button>
			</div>
		</Card>
	{/if}

	{#if data.history.length > 0}
		<Card>
			<h2 class="mb-3 text-lg font-semibold text-blue-grey-900 dark:text-white">
				Generation History
			</h2>
			<div class="space-y-2 text-sm">
				{#each data.history as item (item.id)}
					<div
						class="flex items-center justify-between rounded-lg border border-blue-grey-200 p-2 dark:border-blue-grey-700"
					>
						<div>
							<span class="font-medium text-blue-grey-900 dark:text-white">{item.model}</span>
							<span class="ml-2 text-blue-grey-500 dark:text-blue-grey-300">
								{item.questionCount} questions · {item.createdAt}
							</span>
						</div>
						<Badge
							color={item.status === 'completed'
								? 'green'
								: item.status === 'failed'
									? 'red'
									: 'yellow'}
						>
							{item.status}
						</Badge>
					</div>
				{/each}
			</div>
		</Card>
	{/if}
</PageContainer>

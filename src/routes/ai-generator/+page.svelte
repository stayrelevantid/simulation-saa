<script lang="ts">
	import { Alert, Badge, Button, Checkbox, Input, Label, Spinner } from 'flowbite-svelte';
	import { onMount, onDestroy } from 'svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import QuestionMeta from '$lib/components/question/QuestionMeta.svelte';
	import QuestionOptions from '$lib/components/question/QuestionOptions.svelte';
	import QuestionExplanation from '$lib/components/question/QuestionExplanation.svelte';
	import ModelPicker from '$lib/components/ai/ModelPicker.svelte';
	import ServicePicker from '$lib/components/ai/ServicePicker.svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import type { AIModel, GeneratedQuestion } from '$lib/ai/provider';
	import type { GenerationJobResult } from '$lib/ai/generator';

	let { data }: PageProps = $props();

	let models = $state<AIModel[]>([]);
	let modelsError = $state('');
	let loadingModels = $state(false);
	let selectedModel = $state('');
	let questionCount = $state(20);
	let difficulty = $state<string[]>(['medium', 'hard']);
	let questionTypes = $state<string[]>(['single', 'multiple']);
	let selectedDomains = $state<string[]>([]);
	let selectedServices = $state<string[]>([]);

	let jobStatus = $state<'idle' | 'running' | 'completed' | 'failed'>('idle');
	let jobId = $state<number | null>(null);
	let progPct = $state(0);
	let startTs = $state(0);
	let generateError = $state('');
	let generateRaw = $state('');

	let validQuestions = $state<GeneratedQuestion[]>([]);
	let needReview = $state<{ question: GeneratedQuestion; issues: string[] }[]>([]);
	let savedCount = $state(0);

	let previewIndex = $state(0);
	let previewSource = $state<'valid' | 'review'>('valid');
	let showRaw = $state(false);

	// Seeded from the server load, then kept fresh via refreshHistory() (start / success / failure).
	// svelte-ignore state_referenced_locally
	let history = $state(data.history);
	let historyRefreshing = $state(false);

	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let historyTimer: ReturnType<typeof setInterval> | undefined;

	const countValid = $derived(
		Number.isInteger(questionCount) && questionCount >= 1 && questionCount <= 50
	);
	const difficultyValid = $derived(difficulty.length > 0);
	const typeValid = $derived(questionTypes.length > 0);
	const domainsValid = $derived(selectedDomains.length > 0);
	const modelValid = $derived(selectedModel !== '');
	const formValid = $derived(
		countValid && difficultyValid && typeValid && domainsValid && modelValid
	);

	async function loadModels() {
		loadingModels = true;
		modelsError = '';
		try {
			const response = await fetch('/api/ai/models');
			const payload = await response.json();
			if (response.ok) {
				models = payload.models ?? [];
				if (models.length === 0) modelsError = 'No models returned by OpenCode Go.';
			} else {
				modelsError = payload.error ?? 'Failed to load models';
			}
		} catch {
			modelsError = 'Unable to connect to OpenCode Go.';
		} finally {
			loadingModels = false;
		}
	}

	onMount(() => {
		selectedDomains = data.domains.map((d) => d.name.toLowerCase().replace(/[^a-z]+/g, '_'));
		loadModels();
		resumeStoredJob();
		// Keep the generation history live (status transitions, stale timeouts, other tabs)
		historyTimer = setInterval(() => void refreshHistory(), 5000);
	});

	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
		if (historyTimer) clearInterval(historyTimer);
	});

	function saveJobId() {
		if (typeof sessionStorage !== 'undefined' && jobId !== null) {
			sessionStorage.setItem('ai-job-id', String(jobId));
		}
	}

	function clearJobId() {
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem('ai-job-id');
		}
	}

	async function refreshHistory() {
		historyRefreshing = true;
		try {
			const response = await fetch('/api/ai/history');
			if (!response.ok) return;
			const payload = await response.json();
			history = payload.history ?? [];
		} catch {
			// keep the current history on transient errors
		} finally {
			historyRefreshing = false;
		}
	}

	function parseResult(item: { result: string | null }): GenerationJobResult | null {
		if (!item.result) return null;
		try {
			return JSON.parse(item.result) as GenerationJobResult;
		} catch {
			return null;
		}
	}

	async function resumeStoredJob() {
		if (typeof sessionStorage === 'undefined') return;
		const stored = sessionStorage.getItem('ai-job-id');
		if (!stored) return;
		const id = Number(stored);
		if (!Number.isInteger(id) || id <= 0) return;

		try {
			const response = await fetch(`/api/ai/jobs/${id}`);
			if (!response.ok) {
				clearJobId();
				return;
			}
			const data = await response.json();
			if (data.status === 'running') {
				jobId = id;
				jobStatus = 'running';
				startTs = Date.now();
				progPct = 0;
				if (pollTimer) clearInterval(pollTimer);
				pollTimer = setInterval(poll, 1500);
			} else if (data.status === 'completed') {
				clearJobId();
				applyResult(data.result);
			} else {
				clearJobId();
				failJob(data.result);
			}
		} catch {
			// transient; leave storage so a later mount can retry
		}
	}

	function applyResult(result: GenerationJobResult) {
		clearJobId();
		const preview = (result.preview ?? []) as GeneratedQuestion[];
		const issues = result.issues ?? [];
		const issuesFor = (index: number) =>
			issues.filter((issue) => issue.questionIndex === index).map((issue) => issue.message);

		validQuestions = preview.filter((_, i) => issuesFor(i).length === 0);
		needReview = preview
			.map((question, i) => ({ question, issues: issuesFor(i) }))
			.filter((item) => item.issues.length > 0);
		savedCount = result.importedCount ?? 0;
		previewIndex = 0;
		previewSource = 'valid';
		jobStatus = 'completed';
		void refreshHistory();
	}

	function failJob(result?: GenerationJobResult) {
		clearJobId();
		// Return to the generator form so the user can start again immediately
		jobStatus = 'idle';
		generateError = result?.error ?? 'Generation failed.';
		generateRaw = result?.rawPreview ?? '';
		void refreshHistory();
	}

	async function poll() {
		if (!jobId) return;
		try {
			const response = await fetch(`/api/ai/jobs/${jobId}`);
			if (!response.ok) {
				failJob();
				return;
			}
			const data = await response.json();
			if (data.status === 'running') {
				const elapsed = Date.now() - startTs;
				progPct = Math.min(90, Math.round((elapsed / 90_000) * 90));
			} else if (data.status === 'completed') {
				if (pollTimer) clearInterval(pollTimer);
				progPct = 100;
				applyResult(data.result);
			} else {
				if (pollTimer) clearInterval(pollTimer);
				failJob(data.result);
			}
		} catch {
			// transient poll error; keep polling
		}
	}

	async function generate() {
		if (!formValid || jobStatus === 'running') return;

		jobStatus = 'running';
		progPct = 0;
		startTs = Date.now();
		generateError = '';
		generateRaw = '';
		validQuestions = [];
		needReview = [];
		savedCount = 0;
		showRaw = false;

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
					awsServices: selectedServices.length > 0 ? selectedServices : undefined
				})
			});
			const payload = await response.json();
			if (!response.ok) {
				jobStatus = 'failed';
				generateError = payload.error ?? 'Failed to start generation';
				return;
			}
			jobId = payload.jobId;
			saveJobId();
			void refreshHistory();
			if (pollTimer) clearInterval(pollTimer);
			pollTimer = setInterval(poll, 1500);
		} catch {
			jobStatus = 'failed';
			generateError = 'Unable to start AI generation.';
		}
	}

	function reset() {
		if (pollTimer) clearInterval(pollTimer);
		clearJobId();
		jobStatus = 'idle';
		jobId = null;
		progPct = 0;
		validQuestions = [];
		needReview = [];
		savedCount = 0;
		generateError = '';
		generateRaw = '';
		showRaw = false;
		previewIndex = 0;
		previewSource = 'valid';
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
		subtitle="Generate original scenario-based SAA-C03 questions with OpenCode Go. Valid questions are saved to the Question Bank automatically."
	/>

	<SectionCard>
		<form
			class="space-y-6"
			onsubmit={(e) => {
				e.preventDefault();
				generate();
			}}
		>
			<div class="grid gap-5 sm:grid-cols-2">
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Exam Profile
					</Label>
					<Input value="SAA-C03" disabled />
				</div>
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						AI Model
					</Label>
					<ModelPicker
						{models}
						selected={selectedModel}
						{modelsError}
						loading={loadingModels}
						onRetry={loadModels}
						onselect={(id) => (selectedModel = id)}
					/>
					{#if !modelValid && !loadingModels && !modelsError}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Select an AI model.
						</p>
					{/if}
				</div>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Question Count (1-50)
					</Label>
					<Input type="number" bind:value={questionCount} min="1" max="50" />
					{#if !countValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Question count must be a whole number between 1 and 50.
						</p>
					{/if}
				</div>
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						AWS Services <span class="font-normal text-blue-grey-400">(optional)</span>
					</Label>
					<ServicePicker
						selected={selectedServices}
						onchange={(services) => (selectedServices = services)}
					/>
				</div>
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Question Type
					</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={questionTypes} value="single">Single Choice</Checkbox>
						<Checkbox bind:group={questionTypes} value="multiple">Multiple Response</Checkbox>
					</div>
					{#if !typeValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Select at least one question type.
						</p>
					{/if}
				</div>
				<div>
					<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Difficulty
					</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={difficulty} value="easy">Easy</Checkbox>
						<Checkbox bind:group={difficulty} value="medium">Medium</Checkbox>
						<Checkbox bind:group={difficulty} value="hard">Hard</Checkbox>
					</div>
					{#if !difficultyValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Select at least one difficulty level.
						</p>
					{/if}
				</div>
			</div>

			<div>
				<Label class="mb-2 block text-sm font-medium text-blue-grey-800 dark:text-blue-grey-100">
					Domain
				</Label>
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
				{#if !domainsValid}
					<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
						Select at least one domain.
					</p>
				{/if}
			</div>

			<Button
				type="submit"
				color="primary"
				size="lg"
				class="w-full"
				disabled={jobStatus === 'running' || !formValid}
			>
				{#if jobStatus === 'running'}
					<Spinner size="4" class="mr-2" /> Generating…
				{:else}
					Generate Questions
				{/if}
			</Button>
		</form>
	</SectionCard>

	{#if jobStatus === 'running'}
		<SectionCard>
			<div class="p-6 text-center">
				<div class="text-3xl font-bold text-teal-600 dark:text-teal-300">{progPct}%</div>
				<div
					class="mt-3 h-3 w-full overflow-hidden rounded-full bg-blue-grey-100 dark:bg-blue-grey-700"
				>
					<div
						class="h-3 rounded-full bg-teal-500 transition-all duration-700 ease-out"
						style="width: {progPct}%"
					></div>
				</div>
				<div
					class="mt-3 flex items-center justify-center gap-2 text-sm text-blue-grey-500 dark:text-blue-grey-300"
				>
					<Spinner size="4" /> Generating questions via OpenCode Go… valid questions are saved automatically.
				</div>
			</div>
		</SectionCard>
	{/if}

	{#if generateError}
		<SectionCard variant="danger">
			<p class="text-sm text-red-700 dark:text-red-300">{generateError}</p>
			{#if generateRaw}
				<Button size="xs" color="red" outline class="mt-3" onclick={() => (showRaw = !showRaw)}>
					{showRaw ? 'Hide raw output' : 'Show raw output'}
				</Button>
				{#if showRaw}
					<pre
						class="mt-3 max-h-64 overflow-auto rounded-lg bg-blue-grey-900 p-3 text-xs text-blue-grey-100">
{generateRaw}</pre>
				{/if}
			{/if}
		</SectionCard>
	{/if}

	{#if jobStatus === 'completed' && (validQuestions.length > 0 || needReview.length > 0)}
		<SectionCard>
			<div class="mb-5 flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">
					{validQuestions.length + needReview.length} Questions Generated
				</h2>
				<div class="flex flex-wrap gap-2">
					<Badge color="primary">✓ {validQuestions.length} Valid</Badge>
					{#if needReview.length > 0}
						<Badge color="yellow">⚠ {needReview.length} Need Review</Badge>
					{/if}
				</div>
			</div>

			{#if savedCount > 0}
				<SectionCard variant="success" class="mb-5">
					<p class="text-sm text-teal-800 dark:text-teal-200">
						<strong>Auto-saved.</strong>
						{savedCount} valid question
						{savedCount === 1 ? '' : 's'} imported into the Question Bank.
					</p>
					<a
						href={resolve('/questions')}
						class="mt-2 inline-block text-sm font-medium text-teal-700 underline hover:text-teal-800 dark:text-teal-300"
					>
						View Question Bank →
					</a>
				</SectionCard>
			{:else}
				<SectionCard variant="warning" class="mb-5">
					<p class="text-sm text-yellow-800 dark:text-yellow-200">
						No valid questions to save — review the flagged questions below or regenerate.
					</p>
				</SectionCard>
			{/if}

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
						class="h-8 w-8 shrink-0 rounded text-xs font-medium {previewIndex === i
							? 'bg-primary-600 text-white'
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
				<div class="rounded-xl border border-blue-grey-100 p-5 dark:border-blue-grey-700">
					<QuestionMeta
						questionNumber={`Generated ${previewIndex + 1}`}
						questionType={currentPreview.type}
						difficulty={currentPreview.difficulty}
						domainName={currentPreview.domain}
						services={currentPreview.services}
					/>

					<p class="mt-4 leading-relaxed whitespace-pre-line text-blue-grey-900 dark:text-white">
						{currentPreview.question}
					</p>

					<div class="mt-4">
						<QuestionOptions
							options={currentPreview.options.map((o) => ({
								optionKey: o.key,
								optionText: o.text,
								isCorrect: o.correct,
								explanation: o.explanation
							}))}
							questionType={currentPreview.type}
							revealAnswers
						/>
					</div>

					<div class="mt-4">
						<QuestionExplanation
							explanation={currentPreview.explanation}
							keyConcept={currentPreview.keyConcept}
							reference={currentPreview.reference}
						/>
					</div>
				</div>
			{/if}

			<div class="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
				<Button color="primary" outline onclick={reset}>Cancel</Button>
				<Button color="primary" outline onclick={generate}>Regenerate All</Button>
				<Button href={resolve('/questions')} color="primary">View Question Bank</Button>
			</div>
		</SectionCard>
	{/if}

	<SectionCard>
		<div class="mb-3 flex items-center justify-between gap-2">
			<h2 class="text-lg font-semibold text-blue-grey-900 dark:text-white">Generation History</h2>
			<Button size="xs" color="gray" outline onclick={refreshHistory} disabled={historyRefreshing}>
				{#if historyRefreshing}
					<Spinner size="4" class="mr-2" /> Refreshing…
				{:else}
					Refresh
				{/if}
			</Button>
		</div>
		{#if history.length === 0}
			<p class="text-sm text-blue-grey-500 dark:text-blue-grey-300">
				No generations yet. Run your first generation above.
			</p>
		{:else}
			<div class="space-y-2 text-sm">
				{#each history as item (item.id)}
					{@const result = parseResult(item)}
					<div
						class="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between {jobId ===
						item.id
							? 'border-teal-300 bg-teal-050/40 dark:border-teal-700 dark:bg-teal-900/20'
							: 'border-blue-grey-100 dark:border-blue-grey-700'}"
					>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
								<span class="truncate font-medium text-blue-grey-900 dark:text-white">
									{item.model}
								</span>
								<span class="text-blue-grey-500 dark:text-blue-grey-300">
									{item.questionCount} questions
								</span>
								{#if item.status === 'completed' && result}
									<span class="text-teal-700 dark:text-teal-300">
										· {result.importedCount} saved
									</span>
								{:else if item.status === 'failed' && result?.error}
									<span class="truncate text-red-700 dark:text-red-300">· {result.error}</span>
								{/if}
							</div>
							{#if item.status === 'running'}
								<span class="mt-1 block text-xs text-yellow-700 dark:text-yellow-300">
									In progress — this list updates automatically when it finishes.
								</span>
							{/if}
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<span class="text-xs text-blue-grey-400 dark:text-blue-grey-300">
								{new Date(item.createdAt).toLocaleString()}
							</span>
							<Badge
								color={item.status === 'completed'
									? 'primary'
									: item.status === 'failed'
										? 'red'
										: 'yellow'}
							>
								{#if item.status === 'running'}
									<Spinner size="4" class="mr-1" /> Running
								{:else if item.status === 'completed'}
									✓ Completed
								{:else}
									✗ Failed
								{/if}
							</Badge>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</SectionCard>
</PageContainer>

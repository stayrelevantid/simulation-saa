<script lang="ts">
	import { Alert, Badge, Button, Checkbox, Input, Label, Select } from 'flowbite-svelte';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';

	let { data, form }: PageProps = $props();

	let count = $state(10);
	let customCount = $state('');
	let domainId = $state('');
	let difficulty = $state<string[]>(['easy']);
	let questionType = $state<string[]>(['single', 'multiple']);
	let validationError = $state('');

	$effect(() => {
		if (form?.fields?.count !== undefined) {
			customCount = form.fields.count;
		}
	});

	const presetCounts = [10, 20, 30, 50];
	const isWrongMode = $derived(data.mode === 'wrong');

	const effectiveCount = $derived(customCount !== '' ? Number(customCount) || 0 : count);
	const estimatedMinutes = $derived(Math.max(1, Math.ceil(effectiveCount * 1.5)));

	const countValid = $derived(
		customCount === '' ||
			(Number.isInteger(Number(customCount)) &&
				Number(customCount) >= 1 &&
				Number(customCount) <= 100)
	);
	const difficultyValid = $derived(difficulty.length > 0);
	const questionTypeValid = $derived(questionType.length > 0);
	const formValid = $derived(
		effectiveCount >= 1 &&
			effectiveCount <= 100 &&
			countValid &&
			difficultyValid &&
			questionTypeValid
	);

	const difficultyLabel = $derived.by(() => {
		if (difficulty.length === 0) return '–';
		if (difficulty.length === 3) return 'All Levels';
		return difficulty.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(' + ');
	});

	const questionTypeLabel = $derived.by(() => {
		if (questionType.length === 0) return '–';
		if (questionType.length === 2) return 'Both Types';
		return questionType
			.map((t) => (t === 'single' ? 'Multiple Choice' : 'Multiple Response'))
			.join(' + ');
	});

	function selectPreset(preset: number) {
		count = preset;
		customCount = '';
		validationError = '';
	}

	function onCustomInput() {
		if (customCount !== '') count = Number(customCount) || 0;
		validationError = '';
	}

	function validate(): boolean {
		if (
			!Number.isInteger(Number(customCount === '' ? count : customCount)) ||
			effectiveCount < 1 ||
			effectiveCount > 100
		) {
			validationError = 'Question count must be a whole number between 1 and 100.';
			return false;
		}
		if (difficulty.length === 0) {
			validationError = 'Select at least one difficulty level.';
			return false;
		}
		if (questionType.length === 0) {
			validationError = 'Select at least one question type.';
			return false;
		}
		validationError = '';
		return true;
	}

	function onSubmit(event: SubmitEvent) {
		if (!validate()) {
			event.preventDefault();
		}
	}
</script>

<PageContainer variant="narrow">
	<PageHeader
		title={isWrongMode ? 'Practice Wrong Answers' : 'Start Practice'}
		subtitle={isWrongMode
			? 'Review the questions you answered incorrectly, ordered by most frequent mistakes.'
			: 'Choose how many questions and which topics to focus on. Explanations appear after each answer.'}
		centered
	/>

	{#if form?.error}
		<Alert color="red">{form.error}</Alert>
	{/if}

	{#if validationError}
		<Alert color="red">{validationError}</Alert>
	{/if}

	<SectionCard>
		<form method="POST" action="?/start" class="space-y-6" onsubmit={onSubmit}>
			<input type="hidden" name="mode" value={data.mode} />
			<input type="hidden" name="count" value={effectiveCount} />

			{#if !isWrongMode}
				<div>
					<Label class="mb-2 block font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Question Count
					</Label>
					<div class="flex flex-wrap items-center gap-3">
						{#each presetCounts as preset (preset)}
							<Button
								type="button"
								size="sm"
								color="primary"
								outline={count !== preset || customCount !== ''}
								onclick={() => selectPreset(preset)}
							>
								{preset}
							</Button>
						{/each}
						<div class="w-28">
							<Input
								bind:value={customCount}
								oninput={onCustomInput}
								placeholder="Custom"
								type="number"
								min="1"
								max="100"
								name="customCount"
							/>
						</div>
					</div>
					{#if !countValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Custom count must be a whole number between 1 and 100.
						</p>
					{/if}
				</div>

				<div>
					<Label
						for="domainId"
						class="mb-2 block font-medium text-blue-grey-800 dark:text-blue-grey-100"
					>
						Domain
					</Label>
					<Select id="domainId" name="domainId" bind:value={domainId}>
						<option value="">All Domains</option>
						{#each data.domains as domain (domain.id)}
							<option value={String(domain.id)}>{domain.name}</option>
						{/each}
					</Select>
				</div>

				<div>
					<Label class="mb-2 block font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Difficulty
					</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={difficulty} value="easy" name="difficulty">Easy</Checkbox>
						<Checkbox bind:group={difficulty} value="medium" name="difficulty">Medium</Checkbox>
						<Checkbox bind:group={difficulty} value="hard" name="difficulty">Hard</Checkbox>
					</div>
					{#if !difficultyValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Select at least one difficulty level.
						</p>
					{/if}
				</div>

				<div>
					<Label class="mb-2 block font-medium text-blue-grey-800 dark:text-blue-grey-100">
						Question Type
					</Label>
					<div class="flex flex-wrap gap-x-6 gap-y-2">
						<Checkbox bind:group={questionType} value="single" name="questionType">
							Single Choice
						</Checkbox>
						<Checkbox bind:group={questionType} value="multiple" name="questionType">
							Multiple Response
						</Checkbox>
					</div>
					{#if !questionTypeValid}
						<p class="mt-2 text-xs font-medium text-red-700 dark:text-red-300">
							Select at least one question type.
						</p>
					{/if}
				</div>
			{:else}
				<div
					class="flex flex-wrap items-center gap-2 rounded-lg bg-blue-grey-050 p-3 text-sm text-blue-grey-700 dark:bg-blue-grey-900 dark:text-blue-grey-200"
				>
					<Badge color={data.wrongCount > 0 ? 'primary' : 'gray'}>
						{data.wrongCount} wrong questions
					</Badge>
					<Badge color="gray">most frequent mistakes first</Badge>
				</div>
				{#if data.wrongCount === 0}
					<Alert color="yellow">You have no wrong answers to practice yet.</Alert>
				{/if}
			{/if}

			<div
				class="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-blue-grey-050 p-3 text-sm text-blue-grey-700 dark:bg-blue-grey-900 dark:text-blue-grey-200"
			>
				<Badge color={formValid ? 'primary' : 'gray'}
					>{formValid ? effectiveCount : '—'} questions</Badge
				>
				<Badge color="blue">{domainId === '' ? 'All Domains' : 'Selected domain'}</Badge>
				<Badge color={difficultyValid ? 'teal' : 'gray'}>{difficultyLabel}</Badge>
				<Badge color={questionTypeValid ? 'purple' : 'gray'}>{questionTypeLabel}</Badge>
				<Badge color="blue">~{formValid ? estimatedMinutes : '—'} min</Badge>
			</div>

			<Button
				type="submit"
				color="primary"
				size="lg"
				class="w-full"
				disabled={isWrongMode ? data.wrongCount === 0 : !formValid}
			>
				{isWrongMode ? 'Start Wrong Answer Practice' : 'Start Practice'}
			</Button>
		</form>
	</SectionCard>
</PageContainer>

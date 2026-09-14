<script lang="ts">
	import { Alert, Badge, Button, Card, Checkbox, Input, Label, Select } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let count = $state(10);
	let customCount = $state('');
	let domainId = $state('');
	let difficulty = $state<string[]>([]);
	let questionType = $state<string[]>([]);

	const presetCounts = [10, 20, 30, 50];
	const isWrongMode = $derived(data.mode === 'wrong');

	const effectiveCount = $derived(customCount !== '' ? Number(customCount) || 0 : count);
	const estimatedMinutes = $derived(Math.max(1, Math.ceil(effectiveCount * 1.5)));

	function selectPreset(preset: number) {
		count = preset;
		customCount = '';
	}

	function onCustomInput() {
		if (customCount !== '') count = Number(customCount) || 0;
	}
</script>

<div class="mx-auto max-w-3xl space-y-4">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-blue-grey-900 dark:text-white">
			{isWrongMode ? 'Practice Wrong Answers' : 'Start Practice'}
		</h1>
		<p class="mt-1 text-sm text-blue-grey-600 dark:text-blue-grey-200">
			{isWrongMode
				? 'Review the questions you answered incorrectly, ordered by most frequent mistakes.'
				: 'Choose how many questions and which topics to focus on. Explanations appear after each answer.'}
		</p>
	</div>

	{#if form?.error}
		<Alert color="red">{form.error}</Alert>
	{/if}

	<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
		<form method="POST" action="?/start" class="space-y-6">
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
								color={count === preset && customCount === '' ? 'primary' : 'primary'}
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
				</div>
			{/if}

			<div
				class="flex flex-wrap items-center justify-center gap-2 rounded-lg bg-blue-grey-050 p-3 text-sm text-blue-grey-700 dark:bg-blue-grey-900 dark:text-blue-grey-200"
			>
				<Badge color="primary">{effectiveCount || '—'} questions</Badge>
				<Badge color="blue">~{estimatedMinutes} min</Badge>
				<Badge color="gray">learning mode</Badge>
			</div>

			<Button type="submit" color="primary" size="lg" class="w-full">
				{isWrongMode ? 'Start Wrong Answer Practice' : 'Start Practice'}
			</Button>
		</form>
	</Card>
</div>

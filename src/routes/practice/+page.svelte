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

	<SectionCard>
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
	</SectionCard>
</PageContainer>

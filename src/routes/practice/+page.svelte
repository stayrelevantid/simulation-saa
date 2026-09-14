<script lang="ts">
	import { Button, Card, Checkbox, Input, Label, Select } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let count = $state(10);
	let customCount = $state('');
	let domainId = $state('');
	let difficulty = $state<string[]>([]);
	let questionType = $state<string[]>([]);

	const presetCounts = [10, 20, 30, 50];
	const isWrongMode = $derived(data.mode === 'wrong');
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
		{isWrongMode ? 'Practice Wrong Answers' : 'Start Practice'}
	</h1>

	{#if form?.error}
		<div class="rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
			{form.error}
		</div>
	{/if}

	<Card>
		<form method="POST" action="?/start" class="space-y-5">
			<input type="hidden" name="mode" value={data.mode} />

			{#if !isWrongMode}
				<div>
					<Label class="mb-2 block">Question Count</Label>
					<div class="flex flex-wrap items-center gap-3">
						{#each presetCounts as preset (preset)}
							<Button
								type="button"
								size="sm"
								color={count === preset && !customCount ? 'primary' : 'gray'}
								outline={count !== preset || !!customCount}
								onclick={() => {
									count = preset;
									customCount = '';
								}}
							>
								{preset}
							</Button>
						{/each}
						<div class="w-24">
							<Input
								bind:value={customCount}
								placeholder="Custom"
								type="number"
								min="1"
								max="100"
							/>
						</div>
					</div>
				</div>

				<div>
					<Label class="mb-2 block">Domain</Label>
					<Select bind:value={domainId}>
						<option value="">All Domains</option>
						{#each data.domains as domain (domain.id)}
							<option value={String(domain.id)}>{domain.name}</option>
						{/each}
					</Select>
				</div>

				<div>
					<Label class="mb-2 block">Difficulty</Label>
					<div class="flex gap-4">
						<Checkbox bind:group={difficulty} value="easy">Easy</Checkbox>
						<Checkbox bind:group={difficulty} value="medium">Medium</Checkbox>
						<Checkbox bind:group={difficulty} value="hard">Hard</Checkbox>
					</div>
				</div>

				<div>
					<Label class="mb-2 block">Question Type</Label>
					<div class="flex gap-4">
						<Checkbox bind:group={questionType} value="single">Single Choice</Checkbox>
						<Checkbox bind:group={questionType} value="multiple">Multiple Response</Checkbox>
					</div>
				</div>
			{:else}
				<p class="text-sm text-gray-600 dark:text-gray-400">
					You will practice all questions you previously answered incorrectly, ordered by most
					frequent mistakes.
				</p>
			{/if}

			<Button type="submit" color="primary" class="w-full">
				{isWrongMode ? 'Start Wrong Answer Practice' : 'Start Practice'}
			</Button>
		</form>
	</Card>
</div>

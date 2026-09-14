<script lang="ts">
	import { Alert, Badge, Button, Spinner } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import { QUESTION_TYPE_LABELS } from '$lib/types/question';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';

	let { data }: PageProps = $props();

	const questions = $derived(data.questions);
	const total = $derived(questions.length);

	let current = $state(0);
	let selected = $state<string[]>([]);
	let submitted = $state(false);
	let lastCorrect = $state(false);
	let submitting = $state(false);
	let submitError = $state('');
	let results = $state<{ questionId: number; correct: boolean }[]>([]);
	let finished = $state(false);

	const question = $derived(questions[current]);
	const progress = $derived(Math.round(((current + (submitted ? 1 : 0)) / total) * 100));

	const correctCount = $derived(results.filter((r) => r.correct).length);
	const incorrectCount = $derived(results.length - correctCount);
	const accuracy = $derived(
		results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
	);

	function toggleOption(key: string) {
		if (submitted) return;
		if (question.questionType === 'single') {
			selected = [key];
		} else {
			selected = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
		}
	}

	async function submitAnswer() {
		if (selected.length === 0 || submitting) return;

		submitting = true;
		submitError = '';

		try {
			const response = await fetch('/api/practice/answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sessionId: data.sessionId,
					questionId: question.id,
					selected
				})
			});

			if (!response.ok) {
				submitError = 'Unable to save your answer. Please try again.';
				return;
			}

			const result = await response.json();
			lastCorrect = result.correct;
			submitted = true;
			results = [...results, { questionId: question.id, correct: result.correct }];
		} catch {
			submitError = 'Unable to save your answer. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function nextQuestion() {
		if (current + 1 >= total) {
			finished = true;
			return;
		}
		current += 1;
		selected = [];
		submitted = false;
		lastCorrect = false;
		submitError = '';
	}
</script>

{#if finished}
	<div class="mx-auto max-w-2xl space-y-4">
		<SectionCard class="text-center" padding="large">
			<div
				class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-050 text-2xl dark:bg-teal-900/40"
			>
				✓
			</div>
			<h1 class="mb-6 text-2xl font-bold text-blue-grey-900 dark:text-white">Practice Complete</h1>
			<div class="mb-8 grid grid-cols-3 gap-4">
				<div>
					<div class="text-3xl font-bold text-teal-600 dark:text-teal-300">{correctCount}</div>
					<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Correct</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-red-600 dark:text-red-300">{incorrectCount}</div>
					<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Incorrect</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-blue-600 dark:text-blue-300">{accuracy}%</div>
					<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Accuracy</div>
				</div>
			</div>
			<div class="flex flex-wrap justify-center gap-3">
				<Button href={resolve('/practice')}>New Practice</Button>
				<Button href={resolve('/statistics')} color="primary" outline>View Statistics</Button>
				<Button href={resolve('/')} color="primary" outline>Dashboard</Button>
			</div>
		</SectionCard>
	</div>
{:else}
	<div class="mx-auto max-w-3xl space-y-4">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<span class="text-sm font-medium text-blue-grey-600 dark:text-blue-grey-300">
				Question {current + 1} of {total}
			</span>
			<Badge color="blue">{question.domainName}</Badge>
		</div>
		<div class="h-2 w-full rounded-full bg-blue-grey-100 dark:bg-blue-grey-700">
			<div
				class="h-2 rounded-full bg-teal-500 transition-all duration-300"
				style="width: {progress}%"
			></div>
		</div>

		<SectionCard class="w-full" padding="large">
			<div class="border-t-4 border-teal-500 pt-4">
				<div class="flex flex-wrap items-center justify-center gap-2 text-center">
					<Badge color={question.questionType === 'single' ? 'gray' : 'purple'}>
						{QUESTION_TYPE_LABELS[question.questionType]}
					</Badge>
					{#if question.questionType === 'multiple'}
						<span class="text-xs font-medium text-purple-700 dark:text-purple-300">
							Select all that apply
						</span>
					{/if}
				</div>

				<p
					class="mx-auto mt-5 max-w-2xl text-left leading-7 whitespace-pre-line text-blue-grey-900 dark:text-white"
				>
					{question.questionText}
				</p>

				<div class="mt-5 space-y-2">
					{#each question.options as option (option.optionKey)}
						{@const isSelected = selected.includes(option.optionKey)}
						<button
							type="button"
							class="w-full rounded-lg border p-3 text-left transition-colors
							{submitted && option.isCorrect
								? 'border-teal-500 bg-teal-050 dark:border-teal-600 dark:bg-teal-900/40'
								: submitted && isSelected && !option.isCorrect
									? 'border-red-500 bg-red-050 dark:border-red-600 dark:bg-red-900/40'
									: isSelected
										? 'border-teal-500 bg-teal-050 dark:border-teal-500 dark:bg-teal-900/40'
										: 'border-blue-grey-200 hover:border-teal-400 dark:border-blue-grey-700 dark:hover:border-teal-600'}"
							onclick={() => toggleOption(option.optionKey)}
							disabled={submitted}
							aria-pressed={isSelected}
						>
							<span class="font-bold text-blue-grey-900 dark:text-white">
								{#if question.questionType === 'multiple'}{isSelected ? '☑' : '☐'}{/if}
								{option.optionKey}.
							</span>
							<span class="ml-1 text-blue-grey-800 dark:text-blue-grey-100"
								>{option.optionText}</span
							>
						</button>
					{/each}
				</div>

				{#if submitError}
					<Alert color="red" class="mt-4">
						{submitError}
						<div class="mt-2">
							<Button size="sm" color="red" onclick={submitAnswer}>Retry</Button>
						</div>
					</Alert>
				{/if}

				{#if !submitted}
					<Button
						color="primary"
						size="lg"
						class="mt-5 w-full"
						disabled={selected.length === 0 || submitting}
						onclick={submitAnswer}
					>
						{#if submitting}
							<Spinner size="4" class="mr-2" /> Checking Answer...
						{:else}
							Submit Answer
						{/if}
					</Button>
				{/if}

				{#if submitted}
					<div
						class="mt-5 rounded-lg border p-4 {lastCorrect
							? 'border-teal-300 bg-teal-050 dark:border-teal-700 dark:bg-teal-900/40'
							: 'border-red-300 bg-red-050 dark:border-red-700 dark:bg-red-900/40'}"
					>
						<p
							class="mb-2 font-bold {lastCorrect
								? 'text-teal-800 dark:text-teal-300'
								: 'text-red-700 dark:text-red-300'}"
						>
							{lastCorrect ? '✓ Correct' : '✗ Incorrect'}
						</p>

						{#if !lastCorrect}
							<p class="mb-1 text-sm text-blue-grey-700 dark:text-blue-grey-200">
								<strong>Correct answer:</strong>
								{question.options
									.filter((o) => o.isCorrect)
									.map((o) => o.optionKey)
									.join(', ')}
							</p>
						{/if}

						<p class="text-sm text-blue-grey-700 dark:text-blue-grey-200">
							<strong>Explanation:</strong>
							{question.explanation}
						</p>

						{#if question.keyConcept}
							<p class="mt-2 text-sm text-blue-grey-600 dark:text-blue-grey-300">
								<strong>Key Concept:</strong>
								{question.keyConcept}
							</p>
						{/if}
					</div>

					<Button color="primary" size="lg" class="mt-4 w-full" onclick={nextQuestion}>
						{current + 1 >= total ? 'Finish Practice' : 'Next Question'}
					</Button>
				{/if}
			</div>
		</SectionCard>
	</div>
{/if}

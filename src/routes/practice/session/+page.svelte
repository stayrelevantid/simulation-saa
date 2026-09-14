<script lang="ts">
	import { Badge, Button, Card, Progressbar } from 'flowbite-svelte';
	import type { PageProps } from './$types';
	import { QUESTION_TYPE_LABELS } from '$lib/types/question';

	let { data }: PageProps = $props();

	const questions = $derived(data.questions);
	const total = $derived(questions.length);

	let current = $state(0);
	let selected = $state<string[]>([]);
	let submitted = $state(false);
	let lastCorrect = $state(false);
	let results = $state<{ questionId: number; correct: boolean }[]>([]);
	let finished = $state(false);

	const question = $derived(questions[current]);
	const progress = $derived(Math.round(((current + (submitted ? 1 : 0)) / total) * 100));

	function toggleOption(key: string) {
		if (submitted) return;
		if (question.questionType === 'single') {
			selected = [key];
		} else {
			selected = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
		}
	}

	async function submitAnswer() {
		if (selected.length === 0) return;

		const response = await fetch('/api/practice/answer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				sessionId: data.sessionId,
				questionId: question.id,
				selected
			})
		});
		const result = await response.json();

		lastCorrect = result.correct;
		submitted = true;
		results = [...results, { questionId: question.id, correct: result.correct }];
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
	}

	const correctCount = $derived(results.filter((r) => r.correct).length);
	const incorrectCount = $derived(results.length - correctCount);
	const accuracy = $derived(
		results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
	);
</script>

{#if finished}
	<div class="mx-auto max-w-2xl space-y-4">
		<Card class="p-8 text-center">
			<h1 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Practice Complete</h1>
			<div class="mb-6 grid grid-cols-3 gap-4">
				<div>
					<div class="text-3xl font-bold text-green-600 dark:text-green-400">{correctCount}</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">Correct</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectCount}</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">Incorrect</div>
				</div>
				<div>
					<div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{accuracy}%</div>
					<div class="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
				</div>
			</div>
			<div class="flex justify-center gap-3">
				<Button href="/practice" color="primary">New Practice</Button>
				<Button href="/" color="gray" outline>Back to Dashboard</Button>
			</div>
		</Card>
	</div>
{:else}
	<div class="mx-auto max-w-3xl space-y-4">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
				Question {current + 1} of {total}
			</span>
			<Badge color="blue">{question.domainName}</Badge>
		</div>
		<Progressbar {progress} size="sm" />

		<Card>
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<Badge color={question.questionType === 'single' ? 'gray' : 'purple'}>
					{QUESTION_TYPE_LABELS[question.questionType]}
				</Badge>
				{#if question.questionType === 'multiple'}
					<span class="text-xs font-medium text-orange-600 dark:text-orange-400">
						Select all that apply
					</span>
				{/if}
			</div>

			<p class="whitespace-pre-line text-gray-900 dark:text-white">{question.questionText}</p>

			<div class="mt-5 space-y-2">
				{#each question.options as option (option.optionKey)}
					<button
						type="button"
						class="w-full rounded-lg border p-3 text-left transition-colors
							{submitted && option.isCorrect
							? 'border-green-500 bg-green-50 dark:border-green-600 dark:bg-green-950/40'
							: submitted && selected.includes(option.optionKey) && !option.isCorrect
								? 'border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/40'
								: selected.includes(option.optionKey)
									? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
									: 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'}"
						onclick={() => toggleOption(option.optionKey)}
						disabled={submitted}
					>
						<span class="font-bold">{option.optionKey}.</span>
						<span class="ml-1">{option.optionText}</span>
					</button>
				{/each}
			</div>

			{#if !submitted}
				<Button
					color="primary"
					class="mt-5 w-full"
					disabled={selected.length === 0}
					onclick={submitAnswer}
				>
					Submit Answer
				</Button>
			{/if}

			{#if submitted}
				<div
					class="mt-5 rounded-lg p-4 {lastCorrect
						? 'bg-green-50 dark:bg-green-950/40'
						: 'bg-red-50 dark:bg-red-950/40'}"
				>
					<p
						class="mb-2 font-bold {lastCorrect
							? 'text-green-700 dark:text-green-400'
							: 'text-red-700 dark:text-red-400'}"
					>
						{lastCorrect ? '✓ Correct' : '✗ Incorrect'}
					</p>

					{#if !lastCorrect}
						<p class="mb-1 text-sm text-gray-700 dark:text-gray-300">
							<strong>Correct answer:</strong>
							{question.options
								.filter((o) => o.isCorrect)
								.map((o) => o.optionKey)
								.join(', ')}
						</p>
					{/if}

					<p class="text-sm text-gray-700 dark:text-gray-300">
						<strong>Explanation:</strong>
						{question.explanation}
					</p>

					{#if question.keyConcept}
						<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
							<strong>Key Concept:</strong>
							{question.keyConcept}
						</p>
					{/if}
				</div>

				<Button color="primary" class="mt-4 w-full" onclick={nextQuestion}>
					{current + 1 >= total ? 'Finish Practice' : 'Next Question'}
				</Button>
			{/if}
		</Card>
	</div>
{/if}

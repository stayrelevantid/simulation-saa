<script lang="ts">
	import { Badge, Button, Card, Modal } from 'flowbite-svelte';
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';
	import { QUESTION_TYPE_LABELS } from '$lib/types/question';

	let { data }: PageProps = $props();

	const sessionId = $derived(data.sessionId);

	let questions = $state<
		{
			id: number;
			questionText: string;
			questionType: string;
			domainName: string;
			options: { optionKey: string; optionText: string }[];
		}[]
	>([]);
	let answers = $state<Record<number, { selected: string[]; flagged: boolean }>>({});
	let current = $state(0);
	let remainingSeconds = $derived.by(() => {
		if (!timerStarted) return data.remainingSeconds;
		return Math.max(0, data.remainingSeconds - elapsedTicks);
	});
	let timerStarted = $state(false);
	let elapsedTicks = $state(0);
	let showSubmitModal = $state(false);
	let submitting = $state(false);
	let navigatorOpen = $state(false);

	let timerInterval: ReturnType<typeof setInterval> | undefined;

	const question = $derived(questions[current] ?? null);
	const total = $derived(questions.length);
	const answeredCount = $derived(
		Object.values(answers).filter((a) => a.selected.length > 0).length
	);
	const flaggedCount = $derived(Object.values(answers).filter((a) => a.flagged).length);

	const timeDisplay = $derived.by(() => {
		const h = Math.floor(remainingSeconds / 3600);
		const m = Math.floor((remainingSeconds % 3600) / 60);
		const s = remainingSeconds % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	});

	onMount(async () => {
		const response = await fetch('/api/exam/questions');
		if (response.ok) {
			const payload = await response.json();
			questions = payload.questions;
			answers = payload.answers;
		}

		timerInterval = setInterval(() => {
			timerStarted = true;
			elapsedTicks += 1;
			if (remainingSeconds <= 0) {
				clearInterval(timerInterval);
				autoSubmit();
			}
		}, 1000);
	});

	onDestroy(() => {
		if (timerInterval) clearInterval(timerInterval);
	});

	function toggleOption(key: string) {
		if (!question) return;
		const entry = answers[question.id] ?? { selected: [], flagged: false };
		let newSelected: string[];
		if (question.questionType === 'single') {
			newSelected = entry.selected.includes(key) ? [] : [key];
		} else {
			newSelected = entry.selected.includes(key)
				? entry.selected.filter((k) => k !== key)
				: [...entry.selected, key];
		}
		answers[question.id] = { ...entry, selected: newSelected };
		saveAnswer(question.id, newSelected, entry.flagged);
	}

	function toggleFlag() {
		if (!question) return;
		const entry = answers[question.id] ?? { selected: [], flagged: false };
		answers[question.id] = { ...entry, flagged: !entry.flagged };
		saveAnswer(question.id, entry.selected, !entry.flagged);
	}

	async function saveAnswer(questionId: number, selected: string[], flagged: boolean) {
		await fetch('/api/exam/answer', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, questionId, selected, flag: flagged })
		});
	}

	function goTo(index: number) {
		if (index >= 0 && index < total) {
			current = index;
			navigatorOpen = false;
		}
	}

	async function submitExam() {
		submitting = true;
		await fetch('/api/exam/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId })
		});
		window.location.href = `/results/${sessionId}`;
	}

	async function autoSubmit() {
		if (submitting) return;
		submitting = true;
		await fetch('/api/exam/submit', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId })
		});
		window.location.href = `/results/${sessionId}`;
	}
</script>

<div class="mx-auto max-w-4xl space-y-4">
	<div
		class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="flex items-center gap-3">
			<span class="text-sm font-medium text-gray-500 dark:text-gray-400">
				Question {current + 1} / {total}
			</span>
			<Badge color="blue">{question?.domainName ?? ''}</Badge>
		</div>
		<div class="flex items-center gap-3">
			<span
				class="font-mono text-lg font-bold {remainingSeconds < 300
					? 'text-red-600 dark:text-red-400'
					: 'text-gray-900 dark:text-white'}"
			>
				{timeDisplay}
			</span>
			<Button size="sm" color="gray" onclick={() => (navigatorOpen = true)}>
				Navigator ({answeredCount}/{total})
			</Button>
		</div>
	</div>

	{#if question}
		<Card>
			<div class="mb-3 flex items-center justify-between">
				<Badge color={question.questionType === 'single' ? 'gray' : 'purple'}>
					{QUESTION_TYPE_LABELS[question.questionType as 'single' | 'multiple']}
				</Badge>
				<Button
					size="xs"
					color={answers[question.id]?.flagged ? 'yellow' : 'gray'}
					outline={!answers[question.id]?.flagged}
					onclick={toggleFlag}
				>
					{answers[question.id]?.flagged ? '⚑ Flagged' : '⚐ Flag'}
				</Button>
			</div>

			<p class="whitespace-pre-line text-gray-900 dark:text-white">{question.questionText}</p>

			{#if question.questionType === 'multiple'}
				<p class="mt-2 text-xs font-medium text-orange-600 dark:text-orange-400">
					Select all that apply
				</p>
			{/if}

			<div class="mt-5 space-y-2">
				{#each question.options as option (option.optionKey)}
					<button
						type="button"
						class="w-full rounded-lg border p-3 text-left transition-colors
							{(answers[question.id]?.selected ?? []).includes(option.optionKey)
							? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40'
							: 'border-gray-200 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500'}"
						onclick={() => toggleOption(option.optionKey)}
					>
						<span class="font-bold">{option.optionKey}.</span>
						<span class="ml-1">{option.optionText}</span>
					</button>
				{/each}
			</div>

			<div class="mt-5 flex justify-between">
				<Button color="gray" outline disabled={current === 0} onclick={() => goTo(current - 1)}>
					← Previous
				</Button>
				{#if current === total - 1}
					<Button color="green" onclick={() => (showSubmitModal = true)}>Submit Exam</Button>
				{:else}
					<Button color="primary" onclick={() => goTo(current + 1)}>Next →</Button>
				{/if}
			</div>
		</Card>
	{:else}
		<Card><p class="text-gray-500">Loading questions...</p></Card>
	{/if}
</div>

<Modal bind:open={showSubmitModal} title="Submit Exam?">
	<div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
		<p>Answered: <strong>{answeredCount} / {total}</strong></p>
		<p>Unanswered: <strong>{total - answeredCount}</strong></p>
		<p>Flagged: <strong>{flaggedCount}</strong></p>
	</div>
	<div class="mt-5 flex justify-end gap-2">
		<Button color="gray" onclick={() => (showSubmitModal = false)}>Cancel</Button>
		<Button color="green" disabled={submitting} onclick={submitExam}>
			{submitting ? 'Submitting...' : 'Submit Exam'}
		</Button>
	</div>
</Modal>

<Modal bind:open={navigatorOpen} title="Question Navigator">
	<div class="grid grid-cols-8 gap-2">
		{#each questions as q, i (q.id)}
			{@const entry = answers[q.id]}
			<button
				type="button"
				class="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium
					{current === i
					? 'border-blue-600 bg-blue-600 text-white'
					: entry?.flagged
						? 'border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
						: entry && entry.selected.length > 0
							? 'border-green-500 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
							: 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'}"
				onclick={() => goTo(i)}
			>
				{String(i + 1).padStart(2, '0')}
			</button>
		{/each}
	</div>
	<div class="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
		<span>■ Answered</span>
		<span class="text-yellow-600 dark:text-yellow-400">■ Flagged</span>
		<span>□ Unanswered</span>
	</div>
</Modal>

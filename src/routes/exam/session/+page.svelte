<script lang="ts">
	import { Badge, Button, Modal, Spinner } from 'flowbite-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import QuestionOptions from '$lib/components/question/QuestionOptions.svelte';
	import { QUESTION_TYPE_LABELS } from '$lib/types/question';

	let { data }: PageProps = $props();

	const sessionId = $derived(data.sessionId);

	// Leave guard: prompt when the user tries to leave an in-progress exam
	let examActive = $state(true);
	let leaveTarget = $state<URL | null>(null);
	let leavePromptOpen = $state(false);

	beforeNavigate((nav) => {
		if (!examActive || nav.willUnload) return;
		const target = nav.to?.url;
		if (target && target.pathname !== window.location.pathname) {
			nav.cancel();
			leaveTarget = target;
			leavePromptOpen = true;
		}
	});

	function onBeforeUnload(event: BeforeUnloadEvent) {
		if (!examActive) return;
		event.preventDefault();
		event.returnValue = '';
	}

	function stayInExam() {
		leavePromptOpen = false;
		leaveTarget = null;
	}

	function leaveExam() {
		if (!leaveTarget) return;
		const target = leaveTarget.pathname + leaveTarget.search + leaveTarget.hash;
		leavePromptOpen = false;
		examActive = false;
		goto(target);
	}

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
	let loading = $state(true);
	let loadError = $state('');
	let saving = $state(false);

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

	const timerColor = $derived(
		remainingSeconds < 60
			? 'text-red-600 dark:text-red-300'
			: remainingSeconds < 300
				? 'text-yellow-600 dark:text-yellow-300'
				: 'text-blue-grey-900 dark:text-white'
	);

	async function loadQuestions() {
		loading = true;
		loadError = '';
		try {
			const response = await fetch('/api/exam/questions');
			if (!response.ok) {
				loadError = 'Unable to load exam questions.';
				return;
			}
			const payload = await response.json();
			questions = payload.questions;
			answers = payload.answers;
		} catch {
			loadError = 'Unable to load exam questions.';
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		await loadQuestions();

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
		saving = true;
		try {
			await fetch('/api/exam/answer', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, questionId, selected, flag: flagged })
			});
		} finally {
			saving = false;
		}
	}

	function goTo(index: number) {
		if (index >= 0 && index < total) {
			current = index;
			navigatorOpen = false;
		}
	}

	async function submitExam() {
		submitting = true;
		examActive = false;
		try {
			await fetch('/api/exam/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId })
			});
		} finally {
			window.location.href = `/results/${sessionId}`;
		}
	}

	async function autoSubmit() {
		if (submitting) return;
		submitting = true;
		examActive = false;
		try {
			await fetch('/api/exam/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId })
			});
		} finally {
			window.location.href = `/results/${sessionId}`;
		}
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload} />

<PageContainer variant="reading">
	<div
		class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-grey-100 bg-white p-4 shadow-sm sm:flex-nowrap dark:border-blue-grey-700 dark:bg-blue-grey-800"
	>
		<div class="flex items-center gap-3">
			<span class="text-sm font-medium text-blue-grey-600 dark:text-blue-grey-200">
				Question {current + 1} / {total}
			</span>
			<Badge color="blue">{question?.domainName ?? ''}</Badge>
			{#if saving}
				<span class="hidden items-center gap-1 text-xs text-blue-grey-400 sm:flex">
					<Spinner size="4" /> Saving...
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			<span class="font-mono text-lg font-bold {timerColor}">
				{timeDisplay}
			</span>
			<Button size="sm" color="primary" outline onclick={() => (navigatorOpen = true)}>
				Navigator ({answeredCount}/{total})
			</Button>
		</div>
	</div>

	{#if loading}
		<SectionCard>
			<div
				class="flex items-center justify-center gap-3 p-8 text-blue-grey-500 dark:text-blue-grey-300"
			>
				<Spinner size="6" /> Loading questions...
			</div>
		</SectionCard>
	{:else if loadError}
		<SectionCard variant="danger">
			<p class="text-sm text-red-700 dark:text-red-300">{loadError}</p>
			<div class="mt-3">
				<Button size="sm" color="red" onclick={loadQuestions}>Retry</Button>
			</div>
		</SectionCard>
	{:else if question}
		<SectionCard padding="default">
			<div class="border-t-4 border-teal-500 pt-4">
				<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
					<Badge color={question.questionType === 'single' ? 'gray' : 'purple'}>
						{QUESTION_TYPE_LABELS[question.questionType as 'single' | 'multiple']}
					</Badge>
					<Button
						size="xs"
						color={answers[question.id]?.flagged ? 'yellow' : 'primary'}
						outline={!answers[question.id]?.flagged}
						onclick={toggleFlag}
					>
						{answers[question.id]?.flagged ? '⚑ Flagged' : '⚐ Flag'}
					</Button>
				</div>

				<p class="leading-7 whitespace-pre-line text-blue-grey-900 dark:text-white">
					{question.questionText}
				</p>

				{#if question.questionType === 'multiple'}
					<p class="mt-2 text-xs font-medium text-purple-700 dark:text-purple-300">
						Select all that apply
					</p>
				{/if}

				<div class="mt-4">
					<QuestionOptions
						options={question.options.map((o) => ({
							optionKey: o.optionKey,
							optionText: o.optionText
						}))}
						questionType={question.questionType as 'single' | 'multiple'}
						selected={answers[question.id]?.selected ?? []}
						onSelect={toggleOption}
					/>
				</div>

				<div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-between">
					<Button
						color="primary"
						outline
						disabled={current === 0}
						onclick={() => goTo(current - 1)}
						class="w-full sm:w-auto"
					>
						← Previous
					</Button>
					{#if current === total - 1}
						<Button
							color="primary"
							onclick={() => (showSubmitModal = true)}
							class="w-full sm:w-auto"
						>
							Submit Exam
						</Button>
					{:else}
						<Button color="primary" onclick={() => goTo(current + 1)} class="w-full sm:w-auto">
							Next →
						</Button>
					{/if}
				</div>
			</div>
		</SectionCard>
	{/if}
</PageContainer>

<Modal bind:open={leavePromptOpen} title="Leave exam?">
	<p class="text-sm leading-relaxed text-blue-grey-700 dark:text-blue-grey-200">
		You have an exam in progress. Leaving will <strong>not</strong> auto-submit your exam — your answers
		are already saved and the timer keeps running so you can resume later.
	</p>
	<div class="mt-5 flex justify-end gap-2">
		<Button color="primary" outline onclick={stayInExam}>Stay in Exam</Button>
		<Button color="red" onclick={leaveExam}>Leave Exam</Button>
	</div>
</Modal>

<Modal bind:open={showSubmitModal} title="Submit Exam?">
	<div class="space-y-2 text-sm text-blue-grey-700 dark:text-blue-grey-200">
		<p>Answered: <strong>{answeredCount} / {total}</strong></p>
		<p>Unanswered: <strong>{total - answeredCount}</strong></p>
		<p>Flagged: <strong>{flaggedCount}</strong></p>
	</div>
	<div class="mt-5 flex justify-end gap-2">
		<Button color="primary" outline onclick={() => (showSubmitModal = false)}>Cancel</Button>
		<Button color="primary" disabled={submitting} onclick={submitExam}>
			{submitting ? 'Submitting...' : 'Submit Exam'}
		</Button>
	</div>
</Modal>

<Modal bind:open={navigatorOpen} title="Question Navigator">
	<div class="max-h-[60vh] overflow-y-auto">
		<div class="grid grid-cols-5 gap-2 sm:grid-cols-8">
			{#each questions as q, i (q.id)}
				{@const entry = answers[q.id]}
				<button
					type="button"
					class="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium
						{current === i
						? 'border-teal-600 bg-teal-600 text-white'
						: entry?.flagged
							? 'border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
							: entry && entry.selected.length > 0
								? 'border-teal-400 bg-teal-050 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
								: 'border-blue-grey-300 text-blue-grey-500 dark:border-blue-grey-600 dark:text-blue-grey-300'}"
					onclick={() => goTo(i)}
				>
					{String(i + 1).padStart(2, '0')}
				</button>
			{/each}
		</div>
	</div>
	<div class="mt-4 flex flex-wrap gap-4 text-xs text-blue-grey-500 dark:text-blue-grey-300">
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded border border-teal-400 bg-teal-050"></span> Answered
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded border border-yellow-500 bg-yellow-100"></span>
			Flagged
		</span>
		<span class="flex items-center gap-1">
			<span class="inline-block h-3 w-3 rounded border border-blue-grey-300"></span> Unanswered
		</span>
	</div>
</Modal>

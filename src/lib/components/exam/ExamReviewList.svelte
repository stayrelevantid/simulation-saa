<script lang="ts">
	import { Badge, Button } from 'flowbite-svelte';
	import type { ReviewFilter, ReviewQuestion } from '$lib/repositories/review.repository';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';
	import QuestionMeta from '$lib/components/question/QuestionMeta.svelte';
	import QuestionOptions from '$lib/components/question/QuestionOptions.svelte';
	import QuestionExplanation from '$lib/components/question/QuestionExplanation.svelte';

	let {
		questions,
		counts
	}: {
		questions: ReviewQuestion[];
		counts: { all: number; correct: number; incorrect: number; flagged: number };
	} = $props();

	let filter = $state<ReviewFilter>('all');

	const filtered = $derived.by(() => {
		switch (filter) {
			case 'correct':
				return questions.filter((q) => q.isCorrect);
			case 'incorrect':
				return questions.filter((q) => !q.isCorrect);
			case 'flagged':
				return questions.filter((q) => q.flagged);
			default:
				return questions;
		}
	});

	const filterButtons = $derived.by(() => {
		const buttons: {
			key: ReviewFilter;
			label: string;
			color: 'primary' | 'teal' | 'red' | 'yellow';
		}[] = [
			{ key: 'all', label: `All (${counts.all})`, color: 'primary' },
			{ key: 'correct', label: `Correct (${counts.correct})`, color: 'teal' },
			{ key: 'incorrect', label: `Incorrect (${counts.incorrect})`, color: 'red' },
			{ key: 'flagged', label: `Flagged (${counts.flagged})`, color: 'yellow' }
		];
		return buttons;
	});
</script>

<div class="flex flex-wrap gap-2">
	{#each filterButtons as fb (fb.key)}
		<Button
			size="sm"
			color={filter === fb.key ? fb.color : 'primary'}
			outline={filter !== fb.key}
			onclick={() => (filter = fb.key)}
		>
			{fb.label}
		</Button>
	{/each}
</div>

<div class="grid gap-4">
	{#each filtered as q (q.questionId)}
		<SectionCard>
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<Badge color={q.isCorrect ? 'primary' : 'red'}>
					{q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
				</Badge>
				{#if q.flagged}
					<Badge color="yellow">⚑ Flagged</Badge>
				{/if}
			</div>

			<QuestionMeta
				questionNumber={q.questionNumber}
				questionType={q.questionType as 'single' | 'multiple'}
				difficulty={q.difficulty as 'easy' | 'medium' | 'hard'}
				domainName={q.domainName}
			/>

			<p class="mt-3 leading-relaxed whitespace-pre-line text-blue-grey-900 dark:text-white">
				{q.questionText}
			</p>

			<div class="mt-4">
				<QuestionOptions
					options={q.options.map((o) => ({
						optionKey: o.optionKey,
						optionText: o.optionText,
						isCorrect: o.isCorrect,
						explanation: o.explanation
					}))}
					questionType={q.questionType as 'single' | 'multiple'}
					selected={q.selected}
					revealAnswers
				/>
			</div>

			<QuestionExplanation
				explanation={q.explanation}
				keyConcept={q.keyConcept}
				reference={q.reference}
				correctKeys={q.correctKeys}
				selectedKeys={q.selected}
				showAnswerComparison
			/>
		</SectionCard>
	{/each}
</div>

{#if filtered.length === 0}
	<div
		class="rounded-lg border border-blue-grey-200 p-8 text-center text-blue-grey-500 dark:border-blue-grey-700 dark:text-blue-grey-300"
	>
		No questions in this category.
	</div>
{/if}

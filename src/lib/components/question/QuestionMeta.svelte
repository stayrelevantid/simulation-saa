<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS, SOURCE_LABELS } from '$lib/types/question';
	import type { QuestionType, Difficulty, QuestionSource } from '$lib/types/question';

	let {
		questionNumber,
		questionType,
		difficulty,
		domainName,
		source,
		services = [],
		showServices = true
	}: {
		questionNumber?: number | string;
		questionType: QuestionType;
		difficulty: Difficulty;
		domainName: string;
		source?: QuestionSource;
		services?: string[];
		showServices?: boolean;
	} = $props();

	const difficultyColor: Record<Difficulty, 'primary' | 'yellow' | 'red'> = {
		easy: 'primary',
		medium: 'yellow',
		hard: 'red'
	};
</script>

<div class="flex flex-wrap items-center gap-2">
	{#if questionNumber !== undefined}
		<span class="text-sm font-semibold text-blue-grey-500 dark:text-blue-grey-300">
			{typeof questionNumber === 'number' ? `Question #${questionNumber}` : questionNumber}
		</span>
	{/if}
	<Badge color={difficultyColor[difficulty]}>{DIFFICULTY_LABELS[difficulty]}</Badge>
	<Badge color="blue">{domainName}</Badge>
	<Badge color="gray">{QUESTION_TYPE_LABELS[questionType]}</Badge>
	{#if source}
		<Badge color="purple">{SOURCE_LABELS[source]}</Badge>
	{/if}
</div>

{#if showServices && services.length > 0}
	<div class="mt-2 flex flex-wrap items-center gap-2">
		<span class="text-xs text-blue-grey-500 dark:text-blue-grey-300">Services:</span>
		{#each services as service (service)}
			<Badge color="purple" size="small">{service}</Badge>
		{/each}
	</div>
{/if}

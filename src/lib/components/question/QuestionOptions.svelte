<script lang="ts">
	import { Badge } from 'flowbite-svelte';
	import type { QuestionType } from '$lib/types/question';

	export interface OptionItem {
		optionKey: string;
		optionText: string;
		isCorrect?: boolean;
		explanation?: string | null;
	}

	let {
		options,
		questionType,
		selected = [],
		revealAnswers = false,
		onSelect
	}: {
		options: OptionItem[];
		questionType: QuestionType;
		selected?: string[];
		revealAnswers?: boolean;
		onSelect?: (key: string) => void;
	} = $props();

	const isMultiple = $derived(questionType === 'multiple');

	function optionClass(option: OptionItem, isSelected: boolean): string {
		if (revealAnswers && option.isCorrect) {
			return 'border-teal-500 bg-teal-050 dark:border-teal-600 dark:bg-teal-900/40';
		}
		if (revealAnswers && isSelected && !option.isCorrect) {
			return 'border-red-500 bg-red-050 dark:border-red-600 dark:bg-red-900/40';
		}
		if (isSelected) {
			return 'border-teal-500 bg-teal-050 dark:border-teal-500 dark:bg-teal-900/40';
		}
		return 'border-blue-grey-200 hover:border-teal-400 dark:border-blue-grey-700 dark:hover:border-teal-600';
	}
</script>

<div class="space-y-2">
	{#each options as option (option.optionKey)}
		{@const isSelected = selected.includes(option.optionKey)}
		{#if onSelect}
			<button
				type="button"
				class="w-full rounded-lg border p-3 text-left leading-relaxed transition-colors {optionClass(
					option,
					isSelected
				)}"
				onclick={() => onSelect(option.optionKey)}
				disabled={revealAnswers}
				aria-pressed={isSelected}
			>
				<span class="font-bold text-blue-grey-900 dark:text-white">
					{#if isMultiple}{isSelected ? '☑' : '☐'}{/if}
					{option.optionKey}.
				</span>
				<span class="ml-1 text-blue-grey-800 dark:text-blue-grey-100">{option.optionText}</span>
				{#if revealAnswers && option.isCorrect}
					<Badge color="primary" class="float-right">Correct</Badge>
				{/if}
				{#if option.explanation && revealAnswers}
					<p class="mt-2 pl-5 text-xs text-blue-grey-600 dark:text-blue-grey-300">
						{option.explanation}
					</p>
				{/if}
			</button>
		{:else}
			<div class="rounded-lg border p-3 leading-relaxed {optionClass(option, isSelected)}">
				<div class="flex items-start gap-2">
					<span class="font-bold text-blue-grey-900 dark:text-white">
						{#if isMultiple}{isSelected ? '☑' : '☐'}{/if}
						{option.optionKey}.
					</span>
					<span class="min-w-0 flex-1 text-blue-grey-800 dark:text-blue-grey-100">
						{option.optionText}
					</span>
					{#if revealAnswers && option.isCorrect}
						<Badge color="primary" class="shrink-0">Correct Answer</Badge>
					{:else if revealAnswers && isSelected}
						<Badge color="red" class="shrink-0">Your Answer</Badge>
					{/if}
				</div>
				{#if option.explanation && revealAnswers && (option.isCorrect || isSelected)}
					<p class="mt-2 pl-6 text-sm text-blue-grey-600 dark:text-blue-grey-300">
						{option.explanation}
					</p>
				{/if}
			</div>
		{/if}
	{/each}
</div>

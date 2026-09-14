<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';

	let { data }: PageProps = $props();

	const session = $derived(data.session);
	const profile = $derived(data.profile);

	const passed = $derived(profile ? (session.score ?? 0) >= profile.passingScore : false);
	const incorrectCount = $derived(session.incorrectCount ?? 0);
</script>

<PageContainer variant="narrow">
	<SectionCard padding="large" class="text-center">
		<h1 class="mb-1 text-xl font-semibold text-blue-grey-900 dark:text-white">
			{profile?.code ?? 'Exam'} Mock Exam
		</h1>
		<p class="mb-6 text-xs text-blue-grey-400 dark:text-blue-grey-300">
			Estimated / Simulated Score — not an official AWS score
		</p>

		<div class="mb-6">
			<div
				class="text-5xl font-bold {passed
					? 'text-teal-600 dark:text-teal-300'
					: 'text-red-600 dark:text-red-300'}"
			>
				{session.score ?? '-'} / {profile?.scoreMax ?? 1000}
			</div>
			<div class="mt-3 flex justify-center">
				<span
					class="rounded-full px-4 py-1.5 text-sm font-bold {passed
						? 'bg-teal-050 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200'
						: 'bg-red-050 text-red-700 dark:bg-red-900/50 dark:text-red-200'}"
				>
					{passed ? 'PASS' : 'NOT YET'}
				</span>
			</div>
		</div>

		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
			<div>
				<div class="text-2xl font-bold text-teal-600 dark:text-teal-300">
					{session.correctCount ?? 0} / {profile?.questionCount ?? '-'}
				</div>
				<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Correct</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-red-600 dark:text-red-300">
					{incorrectCount} / {profile?.questionCount ?? '-'}
				</div>
				<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Incorrect</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-blue-600 dark:text-blue-300">
					{session.timeUsedMinutes}m
				</div>
				<div class="text-sm text-blue-grey-500 dark:text-blue-grey-300">Time Used</div>
			</div>
		</div>

		{#if profile}
			<p class="mb-6 text-xs text-blue-grey-500 dark:text-blue-grey-300">
				Passing score: {profile.passingScore} ·
				{passed
					? `You scored ${session.score} (${(session.score ?? 0) - profile.passingScore} above passing)`
					: `You scored ${session.score} (${profile.passingScore - (session.score ?? 0)} below passing)`}
			</p>
		{/if}

		<div class="flex flex-col justify-center gap-3 sm:flex-row">
			<Button href={`/results/${session.id}/review`} color="primary">Review Exam</Button>
			<Button href={resolve('/exam')} color="primary" outline>New Mock Exam</Button>
			<Button href={resolve('/')} color="primary" outline>Dashboard</Button>
		</div>
	</SectionCard>
</PageContainer>

<script lang="ts">
	import { Badge, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const session = $derived(data.session);
	const profile = $derived(data.profile);

	const passed = $derived(profile ? (session.score ?? 0) >= profile.passingScore : false);
	const incorrectCount = $derived(session.incorrectCount ?? 0);
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<Card class="p-8 text-center">
		<h1 class="mb-1 text-xl font-semibold text-gray-900 dark:text-white">
			{profile?.code ?? 'Exam'} Mock Exam
		</h1>
		<p class="mb-6 text-xs text-gray-400">
			Estimated / Simulated Score — not an official AWS score
		</p>

		<div class="mb-6">
			<div
				class="text-5xl font-bold {passed
					? 'text-green-600 dark:text-green-400'
					: 'text-red-600 dark:text-red-400'}"
			>
				{session.score ?? '-'} / {profile?.scoreMax ?? 1000}
			</div>
			<div class="mt-2 flex justify-center">
				<Badge color={passed ? 'green' : 'red'} size="large">
					{passed ? 'PASS' : 'NOT YET'}
				</Badge>
			</div>
		</div>

		<div class="mb-6 grid grid-cols-3 gap-4">
			<div>
				<div class="text-2xl font-bold text-green-600 dark:text-green-400">
					{session.correctCount ?? 0} / {profile?.questionCount ?? '-'}
				</div>
				<div class="text-sm text-gray-500 dark:text-gray-400">Correct</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-red-600 dark:text-red-400">
					{incorrectCount} / {profile?.questionCount ?? '-'}
				</div>
				<div class="text-sm text-gray-500 dark:text-gray-400">Incorrect</div>
			</div>
			<div>
				<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
					{session.timeUsedMinutes}m
				</div>
				<div class="text-sm text-gray-500 dark:text-gray-400">Time Used</div>
			</div>
		</div>

		{#if profile}
			<p class="mb-6 text-xs text-gray-500 dark:text-gray-400">
				Passing score: {profile.passingScore} ·
				{passed
					? `You scored ${session.score} (${(session.score ?? 0) - profile.passingScore} above passing)`
					: `You scored ${session.score} (${profile.passingScore - (session.score ?? 0)} below passing)`}
			</p>
		{/if}

		<div class="flex justify-center gap-3">
			<Button href="/results/{session.id}/review" color="primary">Review Exam</Button>
			<Button href="/exam" color="gray" outline>New Mock Exam</Button>
			<Button href="/" color="gray" outline>Dashboard</Button>
		</div>
	</Card>
</div>

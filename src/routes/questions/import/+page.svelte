<script lang="ts">
	import { Alert, Button } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import PageHeader from '$lib/components/layout/PageHeader.svelte';
	import SectionCard from '$lib/components/ui/SectionCard.svelte';

	let { form }: PageProps = $props();
</script>

<PageContainer variant="narrow">
	<PageHeader
		title="Import Question Bank"
		backHref={resolve('/questions')}
		backLabel="Back to Question Bank"
	/>

	<SectionCard>
		<p class="mb-5 text-sm leading-relaxed text-blue-grey-600 dark:text-blue-grey-200">
			Upload a JSON file containing an array of questions. Each question must include
			<code>questionText</code>, <code>questionType</code> (<code>single</code> |
			<code>multiple</code>), <code>difficulty</code>, <code>domain</code>,
			<code>options</code> (4–5 with correct flags), and <code>explanation</code>. Duplicates are
			detected and skipped automatically.
		</p>

		<form method="POST" action="?/import" enctype="multipart/form-data" class="space-y-4">
			<label
				class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-grey-300 bg-blue-grey-050 p-6 text-center transition-colors hover:border-teal-400 hover:bg-teal-050 sm:p-8 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:hover:border-teal-700 dark:hover:bg-teal-900/30"
			>
				<input type="file" name="file" accept=".json,application/json" class="hidden" />
				<span class="block text-sm font-medium text-blue-grey-700 dark:text-blue-grey-200">
					Click to choose a JSON file
				</span>
				<span class="mt-1 block text-xs text-blue-grey-400 dark:text-blue-grey-300">
					Only .json files are accepted
				</span>
			</label>
			<Button type="submit" color="primary" class="w-full">Upload &amp; Validate</Button>
		</form>
	</SectionCard>

	{#if form?.error}
		<Alert color="red">{form.error}</Alert>
	{/if}

	{#if form?.success}
		<Alert color="green">
			<span class="font-medium">Import complete.</span>
			Detected: {form.detected} · Imported: {form.imported} · Duplicates: {form.duplicates} · Invalid:
			{form.invalid}
		</Alert>

		{#if form.errors.length > 0}
			<Alert color="yellow">
				<span class="font-medium">Validation issues:</span>
				<ul class="mt-1 list-inside list-disc text-sm">
					{#each form.errors as err (err)}
						<li>{err}</li>
					{/each}
				</ul>
			</Alert>
		{/if}
	{/if}
</PageContainer>

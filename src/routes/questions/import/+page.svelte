<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<Button href={resolve('/questions')} size="sm" color="primary" outline>
		← Back to Question Bank
	</Button>

	<Card class="rounded-xl border-blue-grey-100 shadow-sm dark:border-blue-grey-700">
		<h1 class="mb-2 text-xl font-bold text-blue-grey-900 dark:text-white">Import Question Bank</h1>
		<p class="mb-5 text-sm text-blue-grey-600 dark:text-blue-grey-200">
			Upload a JSON file containing an array of questions. Each question must include
			<code>questionText</code>, <code>questionType</code> (<code>single</code> |
			<code>multiple</code>), <code>difficulty</code>, <code>domain</code>,
			<code>options</code> (4–5 with correct flags), and <code>explanation</code>. Duplicates are
			detected and skipped automatically.
		</p>

		<form method="POST" action="?/import" enctype="multipart/form-data" class="space-y-4">
			<label
				class="block cursor-pointer rounded-xl border-2 border-dashed border-blue-grey-300 bg-blue-grey-050 p-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-050 dark:border-blue-grey-600 dark:bg-blue-grey-900 dark:hover:border-teal-700 dark:hover:bg-teal-900/30"
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
	</Card>

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
</div>

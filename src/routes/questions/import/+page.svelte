<script lang="ts">
	import { Alert, Button, Card } from 'flowbite-svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="mx-auto max-w-2xl space-y-4">
	<Button href="/questions" size="sm" color="gray" outline>← Back to Question Bank</Button>

	<Card>
		<h1 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Import Question Bank</h1>

		<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
			Upload a JSON file containing an array of questions. Each question must include
			<code>questionText</code>, <code>questionType</code> (<code>single</code> |
			<code>multiple</code>),
			<code>difficulty</code>, <code>domain</code>, <code>options</code> (4–5 with correct flags),
			and
			<code>explanation</code>. Duplicates are detected and skipped automatically.
		</p>

		<form method="POST" action="?/import" enctype="multipart/form-data" class="space-y-4">
			<input
				type="file"
				name="file"
				accept=".json,application/json"
				class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
			/>
			<Button type="submit" color="primary">Upload &amp; Validate</Button>
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

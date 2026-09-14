<script lang="ts">
	import { pct } from './chart-utils';

	let {
		correct,
		incorrect,
		size = 160
	}: { correct: number; incorrect: number; size?: number } = $props();

	const total = $derived(correct + incorrect);
	const accuracy = $derived(total > 0 ? correct / total : 0);

	const thickness = $derived(size * 0.12);
	const radius = $derived((size - thickness) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const correctLength = $derived(circumference * accuracy);
	const incorrectStart = $derived(circumference * (1 - accuracy));
</script>

<svg
	role="img"
	aria-label="{correct} correct of {total} answered — {pct(accuracy)} accuracy"
	width={size}
	height={size}
	viewBox="0 0 {size} {size}"
	class="mx-auto block"
>
	<!-- track -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke-width={thickness}
		class="stroke-blue-grey-100 dark:stroke-blue-grey-700"
	/>
	<!-- incorrect segment (grey track area = red only when there are mistakes) -->
	{#if incorrect > 0}
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke-width={thickness}
			stroke-dasharray="{incorrectStart} {circumference}"
			stroke-dashoffset={-incorrectStart}
			class="stroke-red-500"
		/>
	{/if}
	<!-- correct segment -->
	<circle
		cx={size / 2}
		cy={size / 2}
		r={radius}
		fill="none"
		stroke-width={thickness}
		stroke-dasharray="{correctLength} {circumference}"
		stroke-dashoffset={-incorrectStart}
		stroke-linecap="round"
		class="stroke-teal-500"
	>
		<animate
			attributeName="stroke-dasharray"
			values="0 {circumference};{correctLength} {circumference}"
			dur="0.6s"
			fill="freeze"
		/>
	</circle>

	<text
		x="50%"
		y="46%"
		text-anchor="middle"
		class="fill-blue-grey-900 text-3xl font-bold dark:fill-white"
	>
		{total > 0 ? pct(accuracy) : '–'}
	</text>
	<text
		x="50%"
		y="60%"
		text-anchor="middle"
		class="fill-blue-grey-500 text-xs dark:fill-blue-grey-300"
	>
		{correct} correct · {incorrect} incorrect
	</text>
</svg>

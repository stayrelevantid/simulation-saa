<script lang="ts">
	let {
		history,
		passingScore,
		scoreMin = 100,
		scoreMax = 1000
	}: {
		history: { score: number; label: string }[];
		passingScore: number;
		scoreMin?: number;
		scoreMax?: number;
	} = $props();

	const width = 720;
	const height = 260;
	const padX = 44;
	const padTop = 20;
	const padBottom = 36;

	const n = $derived(history.length);
	const range = $derived(Math.max(1, scoreMax - scoreMin));

	const x = $derived((i: number) => {
		if (n <= 1) return padX + (width - padX * 2) / 2;
		return padX + (i / (n - 1)) * (width - padX * 2);
	});

	const y = $derived((score: number) => {
		return padTop + (1 - (score - scoreMin) / range) * (height - padTop - padBottom);
	});

	const passingY = $derived(
		padTop + (1 - (passingScore - scoreMin) / range) * (height - padTop - padBottom)
	);

	const points = $derived(history.map((h, i) => `${x(i)},${y(h.score)}`).join(' '));
	const areaPoints = $derived(
		`M${x(0)},${y(history[0].score)} ${points.replaceAll(',', ' ')} L${x(n - 1)},${y(scoreMin)} L${x(0)},${y(scoreMin)} Z`
	);
</script>

{#if n < 2}
	<p class="text-sm text-blue-grey-500 dark:text-blue-grey-300">
		Take at least two mock exams to see your score trend.
	</p>
{:else}
	<svg
		role="img"
		aria-label="Mock exam score trend"
		viewBox="0 0 {width} {height}"
		class="mx-auto block w-full max-w-3xl"
	>
		<defs>
			<linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="var(--color-teal-500)" stop-opacity="0.28" />
				<stop offset="100%" stop-color="var(--color-teal-500)" stop-opacity="0" />
			</linearGradient>
		</defs>

		{#each Array.from({ length: 5 }, (_, gi) => gi) as gi (gi)}
			{@const sy = padTop + (gi / 4) * (height - padTop - padBottom)}
			{@const value = Math.round(scoreMax - (gi / 4) * range)}
			<line
				x1={padX}
				x2={width - padX}
				y1={sy}
				y2={sy}
				class="stroke-blue-grey-100 dark:stroke-blue-grey-700"
				stroke-width="1"
			/>
			<text
				x={padX - 8}
				y={sy + 4}
				text-anchor="end"
				class="fill-blue-grey-400 text-[10px] dark:fill-blue-grey-300"
			>
				{value}
			</text>
		{/each}

		<!-- passing line -->
		<line
			x1={padX}
			x2={width - padX}
			y1={passingY}
			y2={passingY}
			stroke-width="1.5"
			stroke-dasharray="5 5"
			class="stroke-red-500"
		/>
		<text
			x={width - padX}
			y={passingY - 6}
			text-anchor="end"
			class="fill-red-600 text-[10px] font-semibold dark:fill-red-400"
		>
			Passing {passingScore}
		</text>

		<!-- area + line -->
		<path d={areaPoints} fill="url(#trend-fill)" />
		<polyline
			{points}
			fill="none"
			stroke-width="2.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="stroke-teal-500"
		/>

		{#each history as h, i (i)}
			<g>
				<title>{h.label}: {h.score}</title>
				<circle
					cx={x(i)}
					cy={y(h.score)}
					r="4"
					class={h.score >= passingScore ? 'fill-teal-600' : 'fill-red-500'}
				/>
				<text
					x={x(i)}
					y={height - 14}
					text-anchor="middle"
					class="fill-blue-grey-500 text-[10px] dark:fill-blue-grey-300"
				>
					{h.label}
				</text>
			</g>
		{/each}
	</svg>
{/if}

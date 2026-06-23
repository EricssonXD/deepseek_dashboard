<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Arc, BarChart, LineChart, PieChart, Text } from 'layerchart';
	import { scaleBand, scaleUtc } from 'd3-scale';
	import { curveMonotoneX } from 'd3-shape';
	import { cubicInOut } from 'svelte/easing';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { DailyKeyUsage, KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals,
		dailyData = [],
		dailyKeys = [],
		todayData = [],
		todayKeys = [],
		loading = false
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
		dailyData: DailyKeyUsage[];
		dailyKeys: string[];
		todayData: DailyKeyUsage[];
		todayKeys: string[];
		loading?: boolean;
	} = $props();

	let dailyTab = $state<'30d' | 'cumulative'>('30d');

	// Each color with its own tuned L/C. Hue shifts with --primary.
	const COLOR_DEFS = [
		{ l: 0.62, c: 0.22, h: 185 }, // teal
		{ l: 0.58, c: 0.28, h: 280 }, // violet
		{ l: 0.57, c: 0.26, h: 25 }, // red
		{ l: 0.64, c: 0.24, h: 95 }, // yellow
		{ l: 0.58, c: 0.26, h: 142 }, // green
		{ l: 0.57, c: 0.25, h: 255 }, // blue
		{ l: 0.56, c: 0.26, h: 330 }, // magenta
		{ l: 0.6, c: 0.26, h: 55 }, // orange
		{ l: 0.62, c: 0.26, h: 120 } // lime
	];

	let hueShift = $state(0);

	$effect(() => {
		const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
		const m = raw.match(/oklch\(([\d.]+)\s+[\d.]+\s+([\d.]+)/);
		if (m) hueShift = parseFloat(m[2]) - 185;
	});

	const CHART_COLORS = $derived(
		COLOR_DEFS.map((d) => {
			const h = (((d.h + hueShift) % 360) + 360) % 360;
			return `oklch(${d.l} ${d.c} ${Math.round(h)})`;
		})
	);

	// Color map: same key → same color across all charts
	const allKeys = $derived(
		[...new Set([...keyList.map((k) => k.apiKeyName || k.apiKeyMasked), ...dailyKeys])].sort()
	);

	const keyColorMap = $derived(
		Object.fromEntries(allKeys.map((k, i) => [k, CHART_COLORS[i % CHART_COLORS.length]]))
	);

	function keyColor(key: string) {
		return keyColorMap[key] ?? CHART_COLORS[0];
	}

	// ── Bar: multi-series for per-key coloring ──
	const topKeys = $derived(keyList.slice(0, 15));
	const barSeries = $derived(
		topKeys.map((k) => ({
			key: k.apiKeyName || k.apiKeyMasked,
			label: k.apiKeyName || k.apiKeyMasked,
			color: keyColor(k.apiKeyName || k.apiKeyMasked)
		}))
	);
	const barData = $derived(
		topKeys.map((k) => {
			const row: Record<string, string | number> = { name: k.apiKeyName || k.apiKeyMasked };
			row[k.apiKeyName || k.apiKeyMasked] = k.cost;
			return row;
		})
	);
	const barConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(barSeries.map((s) => [s.key, { label: s.label, color: s.color }]))
	);
	const totalBarCost = $derived(topKeys.reduce((s, k) => s + k.cost, 0));

	// ── Pie ──
	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const pieData = $derived(
		modelEntries.map(([model, cost], i) => ({
			model,
			cost,
			color: CHART_COLORS[i % CHART_COLORS.length]
		}))
	);
	const pieConfig = $derived<Chart.ChartConfig>({
		cost: { label: 'Cost' },
		...Object.fromEntries(
			modelEntries.map(([model], i) => [
				model,
				{ label: model, color: CHART_COLORS[i % CHART_COLORS.length] }
			])
		)
	});
	const totalCost = $derived(modelEntries.reduce((s, [, c]) => s + c, 0));

	// ── 30-day line ──
	const dailyConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(dailyKeys.map((key) => [key, { label: key, color: keyColor(key) }]))
	);
	const dailySeries = $derived(dailyKeys.map((key) => ({ key, label: key, color: keyColor(key) })));

	// ── Cumulative line (running total from daily data) ──
	const cumulativeData = $derived.by(() => {
		const running: Record<string, number> = {};
		return dailyData.map((d) => {
			const row: DailyKeyUsage = { date: d.date };
			for (const key of dailyKeys) {
				running[key] = (running[key] || 0) + (d[key] || 0);
				row[key] = running[key];
			}
			return row;
		});
	});
	const cumulativeConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(dailyKeys.map((key) => [key, { label: key, color: keyColor(key) }]))
	);
	const cumulativeSeries = $derived(
		dailyKeys.map((key) => ({ key, label: key, color: keyColor(key) }))
	);

	const activeData = $derived(dailyTab === 'cumulative' ? cumulativeData : dailyData);
	const activeKeys = $derived(dailyKeys);
	const activeConfig = $derived(dailyTab === 'cumulative' ? cumulativeConfig : dailyConfig);
	const activeSeries = $derived(dailyTab === 'cumulative' ? cumulativeSeries : dailySeries);
</script>

<!-- Consumption tabs: 30d / Cumulative / Today -->
{#if loading}
	<div transition:fade={{ duration: 150 }}>
		<div class="px-6 pt-6 pb-6">
			<Card.Root>
				<Card.Header>
					<div class="mb-1 h-4 w-48 animate-pulse rounded-sm bg-muted"></div>
					<div class="h-3 w-64 animate-pulse rounded-sm bg-muted"></div>
				</Card.Header>
				<Card.Content>
					<div class="h-[350px] animate-pulse rounded-lg bg-muted"></div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{:else if dailyData.length > 0}
	<div class="px-6 pt-6 pb-6">
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-sm font-semibold text-foreground"
							>Consumption per API Key</Card.Title
						>
						<Card.Description>
							{#if dailyTab === 'cumulative'}
								Cumulative cost across top {dailyKeys.length} keys
							{:else}
								Daily cost across top {dailyKeys.length} keys
							{/if}
						</Card.Description>
					</div>
					<!-- Tab buttons -->
					<div class="flex rounded-lg border border-primary/10 bg-background p-0.5">
						<button
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {dailyTab ===
							'30d'
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => {
								dailyTab = '30d';
							}}>30d</button
						>
						<button
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {dailyTab ===
							'cumulative'
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground'}"
							onclick={() => {
								dailyTab = 'cumulative';
							}}>Cumul.</button
						>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={activeConfig} class="max-h-[350px]">
					<LineChart
						points={{ r: 4 }}
						data={activeData}
						x="date"
						xScale={scaleUtc()}
						series={activeSeries}
						yPadding={[16, 16]}
						xPadding={[16, 16]}
						props={{
							spline: { curve: curveMonotoneX, motion: 'tween', strokeWidth: 2 },
							highlight: { points: { motion: 'none', r: 6 } },
							xAxis: {
								format: (v: Date) =>
									v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							},
							yAxis: { format: (v: number) => '$' + v.toFixed(2), tickSpacing: 64, tickLength: 0 }
						}}
					>
						{#snippet tooltip()}<Chart.Tooltip hideLabel />{/snippet}
					</LineChart>
				</Chart.Container>
			</Card.Content>
			<Card.Footer>
				<div class="flex w-full items-start gap-2 text-sm">
					<div class="grid gap-2">
						<div class="text-muted-foreground flex items-center gap-2 leading-none">
							{dailyData.length} day{dailyData.length !== 1 ? 's' : ''} of usage data
						</div>
					</div>
				</div>
			</Card.Footer>
		</Card.Root>
	</div>
{/if}

<div class="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 px-6 pb-6">
	{#if loading}
		<div transition:fade={{ duration: 150 }}>
			<Card.Root>
				<Card.Header>
					<div class="mb-1 h-4 w-32 animate-pulse rounded-sm bg-muted"></div>
					<div class="h-3 w-48 animate-pulse rounded-sm bg-muted"></div>
				</Card.Header>
				<Card.Content>
					<div class="h-64 animate-pulse rounded-lg bg-muted"></div>
				</Card.Content>
			</Card.Root>
			<Card.Root class="flex flex-col">
				<Card.Header class="items-center">
					<div class="mb-1 h-4 w-28 animate-pulse rounded-sm bg-muted"></div>
					<div class="h-3 w-40 animate-pulse rounded-sm bg-muted"></div>
				</Card.Header>
				<Card.Content class="flex-1">
					<div class="mx-auto aspect-square h-64 animate-pulse rounded-full bg-muted"></div>
				</Card.Content>
			</Card.Root>
		</div>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm font-semibold text-foreground">Cost per API Key</Card.Title>
				<Card.Description>Top {barData.length} keys by spend</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if barData.length > 0}
					<Chart.Container config={barConfig}>
						<BarChart
							data={barData}
							xScale={scaleBand().padding(0.25)}
							x="name"
							series={barSeries}
							props={{
								bars: {
									stroke: 'none',
									rounded: 'all',
									radius: 8,
									motion: { type: 'tween', duration: 500, easing: cubicInOut }
								},
								highlight: { area: { fill: 'none' } },
								xAxis: { format: (d: string) => (d.length > 12 ? d.slice(0, 12) + '…' : d) },
								yAxis: { format: (v: number) => '$' + v.toFixed(2), tickSpacing: 64, tickLength: 0 }
							}}
						>
							{#snippet tooltip()}<Chart.Tooltip hideLabel />{/snippet}
						</BarChart>
					</Chart.Container>
				{:else}
					<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
				{/if}
			</Card.Content>
			<Card.Footer>
				<div class="flex w-full items-start gap-2 text-sm">
					<div class="grid gap-2">
						<div class="flex items-center gap-2 leading-none font-medium">
							Total: ${totalBarCost.toFixed(2)}
						</div>
						<div class="text-muted-foreground flex items-center gap-2 leading-none">
							Across {barData.length} API key{barData.length !== 1 ? 's' : ''}
						</div>
					</div>
				</div>
			</Card.Footer>
		</Card.Root>

		<!-- Pie: Cost per Model -->
		<Card.Root class="flex flex-col">
			<Card.Header class="items-center">
				<Card.Title class="text-sm font-semibold text-foreground">Cost per Model</Card.Title>
				<Card.Description>Total cost by model</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1">
				{#if pieData.length > 0}
					<Chart.Container config={pieConfig} class="mx-auto max-w-1/2 aspect-square">
						<PieChart
							data={pieData}
							key="model"
							value="cost"
							cRange={pieData.map((d) => d.color)}
							c="color"
							props={{ pie: { motion: 'tween' } }}
						>
							{#snippet tooltip()}<Chart.Tooltip hideLabel />{/snippet}
							{#snippet arc({ props, visibleData, index })}
								<Arc {...props}>
									{#snippet children({ getArcTextProps })}
										<Text
											value={'$' + visibleData[index].cost.toFixed(2)}
											{...getArcTextProps('outer', { startOffset: '50%', outerPadding: 10 })}
											class="fill-foreground"
										/>
									{/snippet}
								</Arc>
							{/snippet}
						</PieChart>
					</Chart.Container>
				{:else}
					<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
				{/if}
			</Card.Content>
			<Card.Footer class="flex-col gap-2 text-sm">
				<div class="text-muted-foreground leading-none">
					Total cost across {pieData.length} model{pieData.length !== 1 ? 's' : ''}
				</div>
			</Card.Footer>
		</Card.Root>
	{/if}
</div>

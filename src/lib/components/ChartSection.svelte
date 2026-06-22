<script lang="ts">
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

	let dailyTab = $state<'today' | '30d'>('30d');

	// Each color with its own tuned L/C. Hue shifts with --primary.
	const COLOR_DEFS = [
		{ l: 0.62, c: 0.22, h: 185 },  // teal
		{ l: 0.58, c: 0.28, h: 280 },  // violet
		{ l: 0.57, c: 0.26, h: 25 },   // red
		{ l: 0.64, c: 0.24, h: 95 },   // yellow
		{ l: 0.58, c: 0.26, h: 142 },  // green
		{ l: 0.57, c: 0.25, h: 255 },  // blue
		{ l: 0.56, c: 0.26, h: 330 },  // magenta
		{ l: 0.60, c: 0.26, h: 55 },   // orange
		{ l: 0.62, c: 0.26, h: 120 },  // lime
	];

	let hueShift = $state(0);

	$effect(() => {
		const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
		const m = raw.match(/oklch\(([\d.]+)\s+[\d.]+\s+([\d.]+)/);
		if (m) hueShift = parseFloat(m[2]) - 185;
	});

	const CHART_COLORS = $derived(
		COLOR_DEFS.map(d => {
			const h = ((d.h + hueShift) % 360 + 360) % 360;
			return `oklch(${d.l} ${d.c} ${Math.round(h)})`;
		})
	);

	// Color map: same key → same color across all charts
	const allKeys = $derived([...new Set([
		...keyList.map(k => k.apiKeyName || k.apiKeyMasked),
		...dailyKeys,
		...todayKeys
	])].sort());

	const keyColorMap = $derived(
		Object.fromEntries(allKeys.map((k, i) => [k, CHART_COLORS[i % CHART_COLORS.length]]))
	);

	function keyColor(key: string) {
		return keyColorMap[key] ?? CHART_COLORS[0];
	}

	// ── Bar ──
	const topKeys = $derived(keyList.slice(0, 15));
	const barData = $derived(topKeys.map(k => ({ name: k.apiKeyName || k.apiKeyMasked, cost: k.cost, color: keyColor(k.apiKeyName || k.apiKeyMasked) })));
	const barConfig = $derived<Chart.ChartConfig>({ cost: { label: 'Cost (USD)', color: CHART_COLORS[0] } });
	const totalBarCost = $derived(barData.reduce((s, d) => s + d.cost, 0));

	// ── Pie ──
	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const pieData = $derived(modelEntries.map(([model, cost], i) => ({ model, cost, color: CHART_COLORS[i % CHART_COLORS.length] })));
	const pieConfig = $derived<Chart.ChartConfig>({
		cost: { label: 'Cost' },
		...Object.fromEntries(modelEntries.map(([model], i) => [model, { label: model, color: CHART_COLORS[i % CHART_COLORS.length] }]))
	});
	const totalCost = $derived(modelEntries.reduce((s, [, c]) => s + c, 0));

	// ── 30-day line ──
	const dailyConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(dailyKeys.map(key => [key, { label: key, color: keyColor(key) }]))
	);
	const dailySeries = $derived(dailyKeys.map(key => ({ key, label: key, color: keyColor(key) })));

	// ── Today line ──
	const todayConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(todayKeys.map(key => [key, { label: key, color: keyColor(key) }]))
	);
	const todaySeries = $derived(todayKeys.map(key => ({ key, label: key, color: keyColor(key) })));

	const activeData = $derived(dailyTab === 'today' ? todayData : dailyData);
	const activeKeys = $derived(dailyTab === 'today' ? todayKeys : dailyKeys);
	const activeConfig = $derived(dailyTab === 'today' ? todayConfig : dailyConfig);
	const activeSeries = $derived(dailyTab === 'today' ? todaySeries : dailySeries);
</script>

<!-- Daily / Today consumption tabs -->
{#if loading}
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
{:else if (dailyTab === '30d' && dailyData.length > 0) || (dailyTab === 'today' && todayData.length > 0)}
	<div class="px-6 pt-6 pb-6">
		<Card.Root>
			<Card.Header>
				<div class="flex items-center justify-between">
					<div>
						<Card.Title class="text-sm font-semibold text-foreground">Consumption per API Key</Card.Title>
						<Card.Description>Daily cost across top {dailyKeys.length} keys</Card.Description>
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
						axis="x"
						series={activeSeries}
						props={{
							spline: { curve: curveMonotoneX, motion: 'tween', strokeWidth: 2 },
							highlight: { points: { motion: 'none', r: 6 } },
							xAxis: {
								format: dailyTab === 'today'
									? (v: Date) => `${v.getUTCHours().toString().padStart(2, '0')}:00`
									: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							}
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
						c="color"
						axis="x"
						series={[{ key: 'cost', label: barConfig.cost.label, color: barConfig.cost.color }]}
						props={{
							bars: { stroke: 'none', rounded: 'all', radius: 8, motion: { type: 'tween', duration: 500, easing: cubicInOut } },
							highlight: { area: { fill: 'none' } },
							xAxis: { format: (d: string) => (d.length > 12 ? d.slice(0, 12) + '…' : d) }
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
					<div class="flex items-center gap-2 leading-none font-medium">Total: ${totalBarCost.toFixed(2)}</div>
					<div class="text-muted-foreground flex items-center gap-2 leading-none">Across {barData.length} API key{barData.length !== 1 ? 's' : ''}</div>
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
					<PieChart data={pieData} key="model" value="cost" cRange={pieData.map((d) => d.color)} c="color" props={{ pie: { motion: 'tween' } }}>
						{#snippet tooltip()}<Chart.Tooltip hideLabel />{/snippet}
						{#snippet arc({ props, visibleData, index })}
							<Arc {...props}>
								{#snippet children({ getArcTextProps })}
									<Text value={visibleData[index].cost} {...getArcTextProps('outer', { startOffset: '50%', outerPadding: 10 })} class="fill-foreground" />
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
			<div class="text-muted-foreground leading-none">Total cost across {pieData.length} model{pieData.length !== 1 ? 's' : ''}</div>
		</Card.Footer>
	</Card.Root>
{/if}
</div>

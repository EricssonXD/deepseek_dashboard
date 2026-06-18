<script lang="ts">
	import { Arc, AreaChart, BarChart, PieChart, Text } from 'layerchart';
	import { scaleBand, scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import { cubicInOut } from 'svelte/easing';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { DailyKeyUsage, KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals,
		dailyData = [],
		dailyKeys = []
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
		dailyData: DailyKeyUsage[];
		dailyKeys: string[];
	} = $props();

	const CHART_COLORS = [
		'var(--color-chart-1)',
		'var(--color-chart-2)',
		'var(--color-chart-3)',
		'var(--color-chart-4)',
		'var(--color-chart-5)',
		'var(--color-chart-6)',
		'var(--color-chart-7)',
		'var(--color-chart-8)',
		'var(--color-chart-9)'
	];

	// ── Bar: cost per API key (top 15) ──
	const topKeys = $derived(keyList.slice(0, 15));
	const barData = $derived(
		topKeys.map((k) => ({
			name: k.apiKeyName || k.apiKeyMasked,
			cost: k.cost
		}))
	);

	const barConfig = $derived<Chart.ChartConfig>({
		cost: { label: 'Cost (USD)', color: 'var(--color-primary)' }
	});

	const totalBarCost = $derived(barData.reduce((s, d) => s + d.cost, 0));

	// ── Pie: cost per model ──
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
				{
					label: model,
					color: CHART_COLORS[i % CHART_COLORS.length]
				}
			])
		)
	});

	const totalCost = $derived(modelEntries.reduce((s, [, c]) => s + c, 0));

	// ── Area: daily consumption per API key ──
	const dailyConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(
			dailyKeys.map((key, i) => [
				key,
				{ label: key, color: CHART_COLORS[i % CHART_COLORS.length] }
			])
		)
	);

	const dailySeries = $derived(
		dailyKeys.map((key, i) => ({
			key,
			label: key,
			color: CHART_COLORS[i % CHART_COLORS.length]
		}))
	);
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-4 px-6 pb-6">
	<!-- Bar Chart: Cost per API Key -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-sm text-foreground">Cost per API Key</Card.Title>
			<Card.Description>Top {barData.length} keys by spend</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if barData.length > 0}
				<Chart.Container config={barConfig}>
					<BarChart
						data={barData}
						xScale={scaleBand().padding(0.25)}
						x="name"
						axis="x"
						series={[
							{
								key: 'cost',
								label: barConfig.cost.label,
								color: barConfig.cost.color
							}
						]}
						props={{
							bars: {
								stroke: 'none',
								rounded: 'all',
								radius: 8,
								motion: { type: 'tween', duration: 500, easing: cubicInOut }
							},
							highlight: { area: { fill: 'none' } },
							xAxis: { format: (d: string) => (d.length > 12 ? d.slice(0, 12) + '…' : d) }
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
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

	<!-- Pie Chart: Cost per Model -->
	<Card.Root class="flex flex-col">
		<Card.Header class="items-center">
			<Card.Title class="text-sm text-foreground">Cost per Model</Card.Title>
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
						props={{
							pie: {
								motion: 'tween'
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
						{#snippet arc({ props, visibleData, index })}
							<Arc {...props}>
								{#snippet children({ getArcTextProps })}
									<Text
										value={visibleData[index].cost}
										{...getArcTextProps('outer', {
											startOffset: '50%',
											outerPadding: 10
										})}
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
</div>

<!-- Area Chart: Daily Consumption per API Key -->
{#if dailyData.length > 0}
	<div class="px-6 pb-6">
		<Card.Root>
			<Card.Header>
				<Card.Title class="text-sm text-foreground">Daily Consumption per API Key</Card.Title>
				<Card.Description>Stacked daily cost across top {dailyKeys.length} keys</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={dailyConfig}>
					<AreaChart
						data={dailyData}
						x="date"
						xScale={scaleUtc()}
						series={dailySeries}
						seriesLayout="overlap"
						props={{
							area: {
								curve: curveNatural,
								fillOpacity: 0.4,
								line: { class: 'stroke-1' },
								motion: 'tween'
							},
							xAxis: {
								format: (v: Date) =>
									v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
							}
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip
								labelFormatter={(v: Date) =>
									v.toLocaleDateString('en-US', {
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})}
								indicator="dot"
							/>
						{/snippet}
					</AreaChart>
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

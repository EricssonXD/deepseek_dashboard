<script lang="ts">
	import { BarChart, PieChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
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

	// ── Donut: cost per model ──
	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const pieData = $derived(
		modelEntries.map(([model, cost]) => ({
			model,
			cost
		}))
	);

	const pieConfig = $derived<Chart.ChartConfig>(
		Object.fromEntries(
			modelEntries.map(([model], i) => [
				model,
				{
					label: model,
					color: CHART_COLORS[i % CHART_COLORS.length]
				}
			])
		)
	);

	const totalCost = $derived(modelEntries.reduce((s, [, c]) => s + c, 0));
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-4 px-6 pb-6">
	<!-- Bar Chart: Cost per API Key -->
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-foreground">Cost per API Key</CardTitle>
		</CardHeader>
		<CardContent>
			{#if barData.length > 0}
				<Chart.Container config={barConfig} class="min-h-[200px] w-full">
					<BarChart
						data={barData}
						xScale={scaleBand().padding(0.25)}
						x="name"
						axis="x"
						grid={false}
						tooltipContext={false}
						series={[
							{
								key: 'cost',
								label: barConfig.cost.label,
								color: barConfig.cost.color
							}
						]}
					>
						{#snippet tooltip()}
							<Chart.Tooltip indicator="line" />
						{/snippet}
					</BarChart>
				</Chart.Container>
			{:else}
				<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
			{/if}
		</CardContent>
	</Card>

	<!-- Donut Chart: Cost per Model -->
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-foreground">Cost per Model</CardTitle>
		</CardHeader>
		<CardContent>
			{#if pieData.length > 0}
				<Chart.Container config={pieConfig} class="min-h-[300px] w-full">
					<PieChart
						data={pieData}
						key="model"
						value="cost"
						c="model"
						innerRadius={70}
						cornerRadius={3}
						padAngle={1}
						tooltipContext={false}
					>
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</PieChart>
				</Chart.Container>
			{:else}
				<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
			{/if}
		</CardContent>
	</Card>
</div>

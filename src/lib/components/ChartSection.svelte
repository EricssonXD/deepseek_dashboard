<script lang="ts">
	import { BarChart, PieChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
	} = $props();

	const topKeys = $derived(keyList.slice(0, 15));
	const barData = $derived(
		topKeys.map((k) => ({
			name: k.apiKeyName || k.apiKeyMasked,
			cost: k.cost
		}))
	);

	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const pieData = $derived(
		modelEntries.map(([model, cost]) => ({
			model,
			cost
		}))
	);
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-4 px-6 pb-6">
	<!-- Bar Chart -->
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-foreground">Cost per API Key</CardTitle>
		</CardHeader>
		<CardContent>
			{#if barData.length > 0}
				<div class="aspect-video w-full">
					<BarChart
						data={barData}
						x="name"
						y="cost"
						axis="x"
						xScale={scaleBand().padding(0.25)}
						legend
					/>
				</div>
			{:else}
				<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
			{/if}
		</CardContent>
	</Card>

	<!-- Donut Chart -->
	<Card>
		<CardHeader>
			<CardTitle class="text-sm text-foreground">Cost per Model</CardTitle>
		</CardHeader>
		<CardContent>
			{#if pieData.length > 0}
				<div class="aspect-video w-full">
					<PieChart
						data={pieData}
						key="model"
						value="cost"
						c="model"
						innerRadius={70}
						cornerRadius={3}
						padAngle={1}
						legend
					/>
				</div>
			{:else}
				<p class="py-10 text-center text-sm text-muted-foreground">No data yet</p>
			{/if}
		</CardContent>
	</Card>
</div>

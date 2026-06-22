<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals,
		grandTotal,
		loading = false
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
		grandTotal: number;
		loading?: boolean;
	} = $props();

	const topKey = $derived(keyList[0]);
	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const topModel = $derived(modelEntries[0]);
	const modelCount = $derived(Object.keys(modelTotals).length);
</script>

<div class="px-6 pt-6">
	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each Array(2) as _}
				<Card>
					<CardHeader>
						<div class="h-3 w-20 animate-pulse rounded-sm bg-muted"></div>
					</CardHeader>
					<CardContent>
						<div class="mb-1 h-8 w-28 animate-pulse rounded-sm bg-muted"></div>
						<div class="h-3 w-12 animate-pulse rounded-sm bg-muted"></div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<!-- Hero: Total Cost -->
		<Card class="mb-4 border-primary/30 bg-primary/5">
			<CardHeader class="pb-2">
				<CardTitle class="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Cost</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="flex items-baseline gap-3">
					<span class="text-5xl font-black tabular-nums tracking-tight text-foreground">
						${grandTotal.toFixed(4)}
					</span>
					<span class="text-base font-medium text-muted-foreground">USD</span>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
					<span><span class="font-semibold tabular-nums text-foreground">{keyList.length}</span> key{keyList.length !== 1 ? 's' : ''}</span>
					<span><span class="font-semibold tabular-nums text-foreground">{modelCount}</span> model{modelCount !== 1 ? 's' : ''}</span>
					{#if topModel}
						<span>top model <span class="font-medium text-foreground">{topModel[0]}</span></span>
					{/if}
				</div>
			</CardContent>
		</Card>

		<!-- Top key cost -->
		<Card>
			<CardHeader>
				<CardTitle class="text-sm font-medium text-foreground">Top Key Cost</CardTitle>
			</CardHeader>
			<CardContent>
				<p class="text-3xl font-bold tabular-nums text-foreground">
					${topKey ? topKey.cost.toFixed(4) : '0.0000'}
				</p>
				{#if topKey}
					<p class="mt-1 text-xs text-muted-foreground">{topKey.apiKeyName}</p>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>

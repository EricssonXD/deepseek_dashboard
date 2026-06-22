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
			<CardContent class="flex items-baseline gap-3">
				<span class="text-5xl font-black tabular-nums tracking-tight text-foreground">
					${grandTotal.toFixed(4)}
				</span>
				<span class="text-base font-medium text-muted-foreground">USD</span>
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

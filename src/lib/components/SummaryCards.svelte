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

<div class="px-6 py-6">
	{#if loading}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each Array(4) as _}
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
		<!-- Hero: Total Cost — full width, largest -->
		<Card class="mb-4 border-primary/20">
			<CardHeader>
				<CardTitle class="text-sm font-medium text-foreground">Total Cost</CardTitle>
			</CardHeader>
			<CardContent class="flex items-baseline gap-2">
				<span class="text-4xl font-bold tabular-nums text-foreground">
					${grandTotal.toFixed(4)}
				</span>
				<span class="text-sm text-muted-foreground">USD</span>
			</CardContent>
		</Card>

		<!-- Secondary metrics row -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card>
				<CardHeader>
					<CardTitle class="text-sm font-medium text-foreground">API Keys</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-semibold tabular-nums text-foreground">{keyList.length}</p>
					<p class="text-xs text-muted-foreground">{topKey ? `Top: ${topKey.apiKeyName}` : ''}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="text-sm font-medium text-foreground">Models Used</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-semibold tabular-nums text-foreground">{modelCount}</p>
					<p class="text-xs text-muted-foreground">
						{topModel ? `Top: ${topModel[0]}` : ''}
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="text-sm font-medium text-foreground">Top Key Cost</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-2xl font-semibold tabular-nums text-foreground">
						${topKey ? topKey.cost.toFixed(4) : '0'}
					</p>
					<p class="text-xs text-muted-foreground">{topKey ? topKey.apiKeyName : ''}</p>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>

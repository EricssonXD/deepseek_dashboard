<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { KeySummary } from '$lib/types/dashboard';

	let {
		keyList,
		modelTotals,
		grandTotal
	}: {
		keyList: KeySummary[];
		modelTotals: Record<string, number>;
		grandTotal: number;
	} = $props();

	const topKey = $derived(keyList[0]);
	const modelEntries = $derived(Object.entries(modelTotals).sort((a, b) => b[1] - a[1]));
	const topModel = $derived(modelEntries[0]);
	const modelCount = $derived(Object.keys(modelTotals).length);
</script>

<div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 px-6 py-6">
	<Card>
		<CardHeader>
			<CardTitle class="text-xs uppercase tracking-wide text-muted-foreground"
				>Total Cost</CardTitle
			>
		</CardHeader>
		<CardContent>
			<p class="text-3xl font-bold text-foreground">${grandTotal.toFixed(4)}</p>
			<p class="text-xs text-muted-foreground">USD</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="text-xs uppercase tracking-wide text-muted-foreground"
				>API Keys</CardTitle
			>
		</CardHeader>
		<CardContent>
			<p class="text-3xl font-bold text-foreground">{keyList.length}</p>
			<p class="text-xs text-muted-foreground">{topKey ? `Top: ${topKey.apiKeyName}` : ''}</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="text-xs uppercase tracking-wide text-muted-foreground"
				>Models Used</CardTitle
			>
		</CardHeader>
		<CardContent>
			<p class="text-3xl font-bold text-foreground">{modelCount}</p>
			<p class="text-xs text-muted-foreground">
				{topModel ? `Top: ${topModel[0]}` : ''}
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle class="text-xs uppercase tracking-wide text-muted-foreground"
				>Top API Key Cost</CardTitle
			>
		</CardHeader>
		<CardContent>
			<p class="text-3xl font-bold text-foreground">
				${topKey ? topKey.cost.toFixed(4) : '0'}
			</p>
			<p class="text-xs text-muted-foreground">{topKey ? topKey.apiKeyName : ''}</p>
		</CardContent>
	</Card>
</div>

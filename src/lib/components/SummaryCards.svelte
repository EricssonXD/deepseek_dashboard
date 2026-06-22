<script lang="ts">
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

<div class="px-6 pb-6">
	{#if loading}
		<div class="flex flex-wrap gap-4 rounded-xl border border-border/50 bg-card px-5 py-3">
			{#each Array(4) as _}
				<div class="flex flex-col gap-1">
					<div class="h-5 w-24 animate-pulse rounded-sm bg-muted"></div>
					<div class="h-3 w-16 animate-pulse rounded-sm bg-muted"></div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-xl border border-border/50 bg-card px-5 py-3">
			<!-- Total cost — lead value -->
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold tabular-nums text-foreground">${grandTotal.toFixed(4)}</span>
				<span class="text-xs font-medium text-muted-foreground">USD</span>
			</div>

			<span class="text-border/60 select-none" aria-hidden="true">·</span>

			<!-- Keys -->
			<div class="flex items-baseline gap-1.5">
				<span class="text-sm font-semibold tabular-nums text-foreground">{keyList.length}</span>
				<span class="text-xs text-muted-foreground">key{keyList.length !== 1 ? 's' : ''}</span>
				{#if topKey}
					<span class="text-xs text-muted-foreground/60 truncate max-w-32">{topKey.apiKeyName}</span>
				{/if}
			</div>

			<span class="text-border/60 select-none" aria-hidden="true">·</span>

			<!-- Models -->
			<div class="flex items-baseline gap-1.5">
				<span class="text-sm font-semibold tabular-nums text-foreground">{modelCount}</span>
				<span class="text-xs text-muted-foreground">model{modelCount !== 1 ? 's' : ''}</span>
				{#if topModel}
					<span class="text-xs text-muted-foreground/60 truncate max-w-32">{topModel[0]}</span>
				{/if}
			</div>

			<span class="text-border/60 select-none" aria-hidden="true">·</span>

			<!-- Top key spend -->
			<div class="flex items-baseline gap-1.5">
				<span class="text-sm font-semibold tabular-nums text-foreground">
					${topKey ? topKey.cost.toFixed(2) : '0.00'}
				</span>
				<span class="text-xs text-muted-foreground">top spend</span>
			</div>
		</div>
	{/if}
</div>

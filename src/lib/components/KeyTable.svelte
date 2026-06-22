<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import type { KeyDetail } from '$lib/types/dashboard';

	let { detailRows, loading = false }: { detailRows: KeyDetail[]; loading?: boolean } = $props();
</script>

<div class="px-6 pb-6">
	<h3 class="mb-3 text-sm font-semibold text-foreground">API Key Breakdown</h3>
	<div class="overflow-x-auto rounded-xl border border-border/50">
		<Table>
			<TableHeader>
				<TableRow class="border-border bg-muted hover:bg-muted">
					<TableHead class="text-xs text-muted-foreground">API Key Name</TableHead>
					<TableHead class="text-xs text-muted-foreground">Key</TableHead>
					<TableHead class="text-xs text-muted-foreground">Models</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Cost (USD)</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Share</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Output Tokens</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Cache Hit</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Cache Miss</TableHead>
					<TableHead class="text-right text-xs text-muted-foreground">Requests</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#if loading}
					{#each Array(5) as _}
						<TableRow class="border-border">
							<TableCell><div class="h-4 w-32 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell><div class="h-4 w-24 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell><div class="h-5 w-40 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-16 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-10 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-20 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-20 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-20 animate-pulse rounded-sm bg-muted"></div></TableCell>
							<TableCell class="text-right"><div class="ml-auto h-4 w-16 animate-pulse rounded-sm bg-muted"></div></TableCell>
						</TableRow>
					{/each}
				{:else}
					{#each detailRows as row}
						<TableRow class="border-border hover:bg-muted/50">
							<TableCell class="text-sm font-medium text-foreground">
								{row.apiKeyName}
							</TableCell>
							<TableCell>
								<span class="font-mono text-xs text-primary">{row.apiKeyMasked}</span>
							</TableCell>
							<TableCell>
								<div class="flex flex-wrap gap-1">
									{#each row.models.split(', ') as model}
										<Badge variant="outline" class="border-primary/30 bg-primary/10 text-primary">
											{model}
										</Badge>
									{/each}
								</div>
							</TableCell>
							<TableCell class="text-right tabular-nums text-sm">
								${row.cost.toFixed(4)}
							</TableCell>
							<TableCell class="text-right tabular-nums text-sm">{row.costPct}%</TableCell>
							<TableCell class="text-right tabular-nums text-sm">
								{row.outputTokens.toLocaleString()}
							</TableCell>
							<TableCell class="text-right tabular-nums text-sm">
								{row.inputCacheHit.toLocaleString()}
							</TableCell>
							<TableCell class="text-right tabular-nums text-sm">
								{row.inputCacheMiss.toLocaleString()}
							</TableCell>
							<TableCell class="text-right tabular-nums text-sm">
								{row.requestCount.toLocaleString()}
							</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
	</div>
</div>

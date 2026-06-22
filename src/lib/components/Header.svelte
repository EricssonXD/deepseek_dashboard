<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { zipCount = 0, onClear }: { zipCount: number; onClear: () => void } = $props();
</script>

<header class="flex items-center justify-between gap-3 border-t-2 border-t-primary bg-background px-6 py-5">
	<div class="flex items-center gap-3">
		<span class="inline-block size-2 rounded-full bg-primary" aria-hidden="true"></span>
		<h1 class="text-lg font-bold tracking-tight text-foreground">
			DeepSeek Usage Dashboard
		</h1>
	</div>
	<div class="flex items-center gap-3">
		{#if zipCount > 0}
			<span class="text-xs font-medium text-muted-foreground">
				{zipCount} file{zipCount !== 1 ? 's' : ''} loaded
			</span>
		{/if}
		<Button variant="ghost" size="sm" onclick={onClear}>Clear All</Button>
	</div>
</header>

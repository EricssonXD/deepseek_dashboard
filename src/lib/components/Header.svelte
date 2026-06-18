<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let { zipCount = 0, onClear }: { zipCount: number; onClear: () => void } = $props();
</script>

<header
	class="flex items-center justify-between gap-3 border-b border-border bg-card px-6 py-4"
>
	<h1 class="text-xl font-semibold text-foreground">DeepSeek Usage Dashboard</h1>
	<div class="flex items-center gap-3">
		{#if zipCount > 0}
			<span class="text-xs text-muted-foreground">{zipCount} file(s) loaded</span>
		{/if}
		<Button variant="outline" size="sm" onclick={onClear}> Clear All </Button>
	</div>
</header>

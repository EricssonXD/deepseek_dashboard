<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	let {
		tokenPrefix = '',
		isConnected = false,
		bookmarkletHref = '',
		onTokenPaste
	}: {
		tokenPrefix: string;
		isConnected: boolean;
		bookmarkletHref: string;
		onTokenPaste: (token: string) => void;
	} = $props();

	let manualToken = $state('');

	function handlePaste() {
		if (manualToken.trim()) {
			onTokenPaste(manualToken.trim());
		}
	}
</script>

<div class="mx-6 mt-6 rounded-lg border border-border bg-card p-4">
	<div class="flex flex-wrap items-end gap-3">
		<div class="flex min-w-[280px] flex-1 items-center gap-2">
			<span
				class="inline-block size-3 shrink-0 rounded-full"
				class:bg-success={isConnected}
				class:bg-destructive={!isConnected}
			></span>
			<span class="text-sm">
				<strong>Token:</strong>
				{#if isConnected}
					Connected ({tokenPrefix})
				{:else}
					Not connected — drag bookmarklet below
				{/if}
			</span>
		</div>

		{#if bookmarkletHref}
			<a
				href={bookmarkletHref}
				class="inline-block shrink-0 cursor-grab rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground no-underline"
				title="Drag this to your bookmarks bar. Then go to platform.deepseek.com and click it."
			>
				DeepSeek Token
			</a>
		{/if}
		<span class="text-xs text-muted-foreground">&larr; Drag to bookmarks bar</span>
	</div>

	<details class="mt-2">
		<summary class="cursor-pointer text-xs text-muted-foreground">Manual token paste</summary>
		<div class="mt-2 flex max-w-lg gap-2">
			<input
				type="password"
				bind:value={manualToken}
				placeholder="Paste token here..."
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
			/>
			<Button variant="outline" size="sm" onclick={handlePaste}> Save </Button>
		</div>
	</details>
</div>

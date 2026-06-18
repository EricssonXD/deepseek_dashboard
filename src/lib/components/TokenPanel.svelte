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
			manualToken = '';
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handlePaste();
	}
</script>

<div class="mx-6 mt-6 rounded-lg border border-border bg-card p-4">
	<div class="flex flex-wrap items-center gap-3">
		<!-- Status dot + label -->
		<div class="flex min-w-[200px] flex-1 items-center gap-2">
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
					Not connected
				{/if}
			</span>
		</div>

		<!-- Bookmarklet (always visible) -->
		<div class="flex items-center gap-2">
			{#if bookmarkletHref}
				<a
					href={bookmarkletHref}
					class="inline-block shrink-0 cursor-grab select-none rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground no-underline"
					draggable="true"
					title="Drag this to your bookmarks bar. Then go to platform.deepseek.com and click it."
				>
					DeepSeek Token
				</a>
			{/if}
			<span class="text-xs text-muted-foreground">&larr; Drag to bookmarks bar</span>
		</div>
	</div>

	<!-- Paste input: shown only when not connected -->
	{#if !isConnected}
		<div class="mt-3 flex max-w-lg gap-2">
			<input
				type="password"
				bind:value={manualToken}
				onkeydown={handleKeydown}
				placeholder="Paste token from bookmarklet here..."
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
			/>
			<Button size="sm" onclick={handlePaste} disabled={!manualToken.trim()}> Save </Button>
		</div>
	{:else}
		<p class="mt-2 text-xs text-muted-foreground">
			Token saved in this browser. The bookmarklet copies your token — just paste it above if reconnecting.
		</p>
	{/if}
</div>

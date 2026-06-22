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
	let showEdit = $state(false);

	function handlePaste() {
		if (manualToken.trim()) {
			onTokenPaste(manualToken.trim());
			manualToken = '';
			showEdit = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handlePaste();
	}
</script>

<div class="mx-6 mt-6 rounded-xl border border-border/50 bg-card p-4">
	<div class="flex flex-wrap items-center gap-3">
		<!-- Status dot + label -->
		<div class="flex min-w-[200px] flex-1 items-center gap-2">
			<span
				class="inline-block size-3.5 shrink-0 rounded-full"
				class:bg-success={isConnected}
				class:bg-destructive={!isConnected}
			></span>
			<span class="text-sm">
				<span class="font-semibold">Token:</span>
				{#if isConnected}
					<span class="font-medium"> Connected</span><span class="text-muted-foreground"> ({tokenPrefix})</span>
					<button
						class="ml-2 text-xs font-medium text-primary hover:underline"
						onclick={() => { showEdit = !showEdit; }}
					>
						{showEdit ? 'cancel' : 'change'}
					</button>
				{:else}
					<span class="font-medium text-muted-foreground"> Not connected</span>
				{/if}
			</span>
		</div>

		<!-- Bookmarklet (always visible) -->
		<div class="flex items-center gap-2">
			{#if bookmarkletHref}
				<a
					href={bookmarkletHref}
					class="inline-block shrink-0 cursor-grab select-none rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground no-underline transition-all hover:bg-primary/90 hover:shadow-[0_0_20px_-6px_var(--color-primary)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					draggable="true"
					title="Drag this to your bookmarks bar. Then go to platform.deepseek.com and click it."
				>
					DeepSeek Token
				</a>
			{/if}
			<span class="text-xs text-muted-foreground">&larr; Drag to bookmarks bar</span>
		</div>
	</div>

	<!-- Paste input: shown when not connected or editing -->
	{#if !isConnected || showEdit}
		<div class="mt-3 flex max-w-lg gap-2">
			<input
				type="text"
				bind:value={manualToken}
				onkeydown={handleKeydown}
				placeholder="Paste token from bookmarklet here..."
				class="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			/>
			<Button size="default" onclick={handlePaste} disabled={!manualToken.trim()}>Save</Button>
		</div>
	{:else if !showEdit}
		<p class="mt-2 text-xs text-muted-foreground">
			Token saved in this browser. Drag the bookmarklet to get a new token if expired.
		</p>
	{/if}
</div>

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
					<button
						class="ml-2 text-xs text-muted-foreground underline hover:text-foreground"
						onclick={() => {
							showEdit = !showEdit;
						}}
					>
						{showEdit ? 'cancel' : 'change'}
					</button>
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

	<!-- Paste input: shown when not connected or editing -->
	{#if !isConnected || showEdit}
		<div class="mt-3 flex max-w-lg gap-2">
			<input
				type="text"
				bind:value={manualToken}
				onkeydown={handleKeydown}
				placeholder="Paste token from bookmarklet here..."
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
			/>
			<Button size="sm" onclick={handlePaste} disabled={!manualToken.trim()}>Save</Button>
		</div>
	{:else if !showEdit}
		<p class="mt-2 text-xs text-muted-foreground">
			Token saved in this browser. Drag the bookmarklet to get a new token if expired.
		</p>
	{/if}
</div>

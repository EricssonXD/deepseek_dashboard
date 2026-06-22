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

<div class="mx-6 mt-6 overflow-hidden rounded-xl border border-border/50 bg-card">
	<!-- Connection status bar -->
	<div class="flex flex-wrap items-center gap-3 px-5 py-4">
		<!-- Status indicator — larger, more prominent -->
		<span
			class="inline-flex size-3 shrink-0 rounded-full ring-2 {isConnected ? 'bg-success ring-success/30' : 'bg-destructive ring-destructive/30'}"
			aria-hidden="true"
		></span>

		<div class="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
			<span class="font-semibold text-foreground">
				{#if isConnected}
					Connected
				{:else}
					No token
				{/if}
			</span>
			{#if isConnected}
				<span class="font-mono text-xs text-muted-foreground truncate">{tokenPrefix}</span>
				<button
					class="shrink-0 text-xs font-medium text-primary hover:underline"
					onclick={() => { showEdit = !showEdit; }}
				>
					{showEdit ? 'cancel' : 'change'}
				</button>
			{/if}
		</div>

		<!-- Bookmarklet — distinctive draggable chip -->
		{#if bookmarkletHref}
			<div class="flex items-center gap-2">
				<a
					href={bookmarkletHref}
					class="inline-flex shrink-0 cursor-grab select-none items-center gap-1.5 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary no-underline transition-all hover:border-primary/70 hover:bg-primary/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					draggable="true"
					title="Drag to bookmarks bar. Visit platform.deepseek.com and click it to capture your token."
				>
					<svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
					</svg>
					DeepSeek Token
				</a>
				<span class="hidden text-xs text-muted-foreground sm:inline">&larr; Drag to bookmarks</span>
			</div>
		{/if}
	</div>

	<!-- Paste input: shown when not connected or editing -->
	{#if !isConnected || showEdit}
		<div class="border-t border-border/30 bg-background px-5 py-4">
			<div class="flex gap-3">
				<div class="relative flex-1">
					<input
						type="text"
						bind:value={manualToken}
						onkeydown={handleKeydown}
						placeholder="sk-..."
						class="h-10 w-full rounded-lg border border-input bg-background px-3.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						autocomplete="off"
						spellcheck="false"
					/>
				</div>
				<Button size="lg" onclick={handlePaste} disabled={!manualToken.trim()}>
					Connect
				</Button>
			</div>
			<p class="mt-2.5 text-xs text-muted-foreground">
				Paste the token captured by the bookmarklet, or drag the bookmarklet to your bar first.
			</p>
		</div>
	{/if}
</div>

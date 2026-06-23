<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { FetchStatus } from '$lib/types/dashboard';

	let {
		tokenPrefix = '',
		isConnected = false,
		bookmarkletHref = '',
		onTokenPaste,
		month,
		year,
		isFetching = false,
		status = { message: '', type: '' } as FetchStatus,
		onMonthChange,
		onYearChange,
		onFetch,
		onRetry,
		onFiles,
		hasData = false,
		existingZipNames = [] as string[]
	}: {
		tokenPrefix: string;
		isConnected: boolean;
		bookmarkletHref: string;
		onTokenPaste: (t: string) => void;
		month: number;
		year: number;
		isFetching: boolean;
		status: FetchStatus;
		onMonthChange: (m: number) => void;
		onYearChange: (y: number) => void;
		onFetch: () => void;
		onRetry?: () => void;
		onFiles: (files: FileList) => void;
		hasData: boolean;
		existingZipNames: string[];
	} = $props();

	// ── Token input state ──
	let manualToken = $state('');
	let showEdit = $state(false);

	// ── Connection pulse ──
	let connectionPulse = $state(false);
	$effect(() => {
		if (isConnected) {
			connectionPulse = true;
			const t = setTimeout(() => {
				connectionPulse = false;
			}, 500);
			return () => clearTimeout(t);
		}
	});

	function handleTokenSubmit() {
		if (manualToken.trim()) {
			onTokenPaste(manualToken.trim());
			manualToken = '';
			showEdit = false;
		}
	}

	function handleTokenKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleTokenSubmit();
	}

	// ── File drop state ──
	let dragging = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();
	let duplicateWarning: string | null = $state(null);

	function checkDuplicates(files: FileList): string[] {
		const dupes: string[] = [];
		for (const file of files) {
			const base = file.name.replace(/\.zip$/i, '');
			if (existingZipNames.includes(base)) dupes.push(file.name);
		}
		return dupes;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		if (e.dataTransfer?.files) {
			const dupes = checkDuplicates(e.dataTransfer.files);
			duplicateWarning = dupes.length > 0 ? `Already loaded: ${dupes.join(', ')}` : null;
			onFiles(e.dataTransfer.files);
		}
	}

	function handleFileChange() {
		if (fileInput?.files) {
			const dupes = checkDuplicates(fileInput.files);
			duplicateWarning = dupes.length > 0 ? `Already loaded: ${dupes.join(', ')}` : null;
			onFiles(fileInput.files);
			fileInput.value = '';
		}
	}

	// ── Derived ──
	const fetchDisabled = $derived(isFetching || !isConnected);
	const monthLabel = $derived(
		new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
	);

	function prevMonth() {
		if (month === 1) {
			onMonthChange(12);
			onYearChange(year - 1);
		} else {
			onMonthChange(month - 1);
		}
	}
	function nextMonth() {
		if (month === 12) {
			onMonthChange(1);
			onYearChange(year + 1);
		} else {
			onMonthChange(month + 1);
		}
	}

	// ── Month picker ──
	let showPicker = $state(false);
	let pickerYear = $state(year);
	let pickerRef: HTMLDivElement | undefined = $state();

	const MONTH_NAMES = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	$effect(() => {
		pickerYear = year;
	});

	function openPicker() {
		showPicker = true;
	}

	function selectMonth(m: number) {
		onMonthChange(m);
		onYearChange(pickerYear);
		showPicker = false;
	}

	function handlePickerKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') showPicker = false;
	}

	$effect(() => {
		if (!showPicker) return;
		let cleanup: (() => void) | undefined;
		const t = setTimeout(() => {
			function clickOutside(e: MouseEvent) {
				if (pickerRef && !pickerRef.contains(e.target as Node)) showPicker = false;
			}
			document.addEventListener('click', clickOutside);
			cleanup = () => document.removeEventListener('click', clickOutside);
		}, 0);
		return () => {
			clearTimeout(t);
			cleanup?.();
		};
	});
</script>

<div class="mx-6 mt-6 rounded-xl border border-border/50 bg-card">
	<!-- ═══ Zone 1: Connection status ═══ -->
	<div class="px-5 py-4">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
			<span
				class="inline-flex size-2.5 shrink-0 rounded-full ring-2 transition-all duration-300 {isConnected
					? 'bg-success ring-success/30'
					: 'bg-destructive ring-destructive/30'} {connectionPulse
					? 'scale-125 ring-success/50'
					: ''}"
				aria-hidden="true"
			></span>

			{#if isConnected && !showEdit}
				<span class="text-sm font-semibold text-foreground">Connected</span>
				<span class="font-mono text-xs text-muted-foreground">{tokenPrefix}</span>
				<button
					class="text-xs font-medium text-primary hover:underline"
					onclick={() => {
						showEdit = true;
					}}>change</button
				>
			{:else}
				<span
					class="text-sm font-semibold {isConnected ? 'text-foreground' : 'text-muted-foreground'}"
				>
					{isConnected ? 'Change token' : 'No token'}
				</span>
				<div class="flex w-full gap-2 sm:w-auto sm:min-w-90">
					<input
						type="text"
						bind:value={manualToken}
						onkeydown={handleTokenKeydown}
						placeholder="sk-..."
						class="h-8 flex-1 rounded-lg border-2 border-muted-foreground/20 bg-background px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						autocomplete="off"
						spellcheck="false"
					/>
					<Button size="sm" onclick={handleTokenSubmit} disabled={!manualToken.trim()}
						>Connect</Button
					>
					{#if isConnected}
						<button
							class="shrink-0 text-xs text-muted-foreground hover:text-foreground"
							onclick={() => {
								showEdit = false;
								manualToken = '';
							}}>cancel</button
						>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Bookmarklet callout — prominently shown when not connected -->
		{#if bookmarkletHref && (!isConnected || showEdit)}
			<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
				<a
					href={bookmarkletHref}
					class="inline-flex cursor-grab select-none items-center gap-2.5 self-start rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary no-underline transition-all hover:border-primary hover:bg-primary/10 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					draggable="true"
					title="Drag to bookmarks bar. Visit platform.deepseek.com and click it to capture your token."
				>
					<svg
						class="size-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
						/>
					</svg>
					DeepSeek Token
				</a>
				<div>
					<p class="text-sm font-medium text-foreground">Drag this to your bookmarks bar</p>
					<p class="text-xs text-muted-foreground">
						Then visit platform.deepseek.com, click the bookmark, and paste the token here.
					</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- ═══ Zone 2: Data inputs ═══ -->
	<div class="border-t border-primary/10 px-5 py-4">
		<div class="flex flex-col gap-4 sm:flex-row sm:gap-6">
			<!-- API fetch -->
			<div class="flex flex-wrap items-center gap-2 sm:flex-1">
				<div
					class="relative inline-flex items-center rounded-lg border border-border bg-background"
				>
					<button
						class="flex size-8 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:outline-none"
						onclick={prevMonth}
						aria-label="Previous month"
					>
						<svg
							class="size-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 19.5 8.25 12l7.5-7.5"
							/></svg
						>
					</button>
					<button
						class="min-w-[8.5rem] px-3 text-center text-sm font-medium text-foreground tabular-nums transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:outline-none"
						onclick={openPicker}
						aria-label="Pick month and year">{monthLabel}</button
					>
					<button
						class="flex size-8 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring focus-visible:outline-none"
						onclick={nextMonth}
						aria-label="Next month"
					>
						<svg
							class="size-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m8.25 4.5 7.5 7.5-7.5 7.5"
							/></svg
						>
					</button>

					<!-- Month/year picker popover -->
					{#if showPicker}
						<div
							bind:this={pickerRef}
							class="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border/60 bg-popover p-3 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
							role="dialog"
							aria-label="Month picker"
							onkeydown={handlePickerKeydown}
						>
							<!-- Year nav -->
							<div class="mb-2 flex items-center justify-between">
								<button
									class="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									onclick={() => {
										pickerYear--;
									}}
									aria-label="Previous year"
								>
									<svg
										class="size-3.5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15.75 19.5 8.25 12l7.5-7.5"
										/></svg
									>
								</button>
								<span class="text-sm font-semibold text-foreground tabular-nums">{pickerYear}</span>
								<button
									class="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									onclick={() => {
										pickerYear++;
									}}
									aria-label="Next year"
								>
									<svg
										class="size-3.5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="2"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="m8.25 4.5 7.5 7.5-7.5 7.5"
										/></svg
									>
								</button>
							</div>
							<!-- Month grid -->
							<div class="grid grid-cols-3 gap-1">
								{#each MONTH_NAMES as name, i}
									{@const m = i + 1}
									<button
										class="rounded-lg px-2 py-1.5 text-xs font-medium transition-colors
											{m === month && pickerYear === year
											? 'bg-primary text-primary-foreground'
											: 'text-foreground hover:bg-muted'}"
										onclick={() => selectMonth(m)}
									>
										{name}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
				<Button size="sm" onclick={onFetch} disabled={fetchDisabled}>
					{#if isFetching}
						Fetching...
					{:else}
						Fetch from API
					{/if}
				</Button>

				{#if status.message}
					<span
						class="text-xs"
						class:text-success={status.type === 'success'}
						class:text-destructive={status.type === 'error'}
						class:text-muted-foreground={status.type !== 'success' && status.type !== 'error'}
					>
						{status.message}
						{#if status.type === 'error' && onRetry}
							<button class="ml-1.5 font-medium text-primary hover:underline" onclick={onRetry}
								>Retry</button
							>
						{/if}
					</span>
				{/if}
			</div>

			<!-- Divider -->
			<div class="hidden border-l border-primary/10 sm:block" aria-hidden="true"></div>

			<!-- File drop -->
			<div
				class="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/15 bg-background px-4 py-3 text-center transition-all hover:border-primary/50 hover:bg-primary/3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-1 {dragging
					? 'border-primary bg-primary/5'
					: ''}"
				role="button"
				tabindex="0"
				onclick={() => fileInput?.click()}
				ondragover={(e) => {
					e.preventDefault();
					dragging = true;
				}}
				ondragleave={() => {
					dragging = false;
				}}
				ondrop={handleDrop}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
				}}
			>
				<svg
					class="mb-0.5 size-5 text-muted-foreground"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
					/>
				</svg>
				<p class="text-xs font-medium text-foreground">Drop ZIP files here</p>
				<p class="text-[0.7rem] text-muted-foreground">or click to browse</p>
				{#if duplicateWarning}
					<p class="mt-1 text-[0.7rem] text-destructive">{duplicateWarning}</p>
				{/if}
				<input
					type="file"
					bind:this={fileInput}
					accept=".zip"
					multiple
					class="hidden"
					onchange={handleFileChange}
				/>
			</div>
		</div>
	</div>

	<!-- ═══ Zone 3: Utility links ═══ -->
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/30 px-5 py-2">
		{#if bookmarkletHref && isConnected && !showEdit}
			<a
				href={bookmarkletHref}
				class="inline-flex cursor-grab items-center gap-1 text-[0.7rem] font-medium text-muted-foreground no-underline transition-colors hover:text-foreground"
				draggable="true"
				title="Drag to bookmarks bar to refresh your token."
			>
				<svg
					class="size-3"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
					/>
				</svg>
				DeepSeek Token
			</a>
			<span class="hidden text-[0.7rem] text-muted-foreground/60 sm:inline"
				>Drag to bookmarks bar</span
			>
			<span class="text-[0.7rem] text-muted-foreground/60">·</span>
		{/if}
		<a
			href="https://platform.deepseek.com/usage"
			target="_blank"
			rel="noopener"
			class="text-[0.7rem] text-muted-foreground no-underline transition-colors hover:text-foreground"
		>
			Download export from platform.deepseek.com/usage
		</a>
	</div>
</div>

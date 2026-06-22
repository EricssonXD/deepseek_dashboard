<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ControlBar from '$lib/components/ControlBar.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import ChartSection from '$lib/components/ChartSection.svelte';
	import KeyTable from '$lib/components/KeyTable.svelte';
	import { handleFiles, buildDailyUsage, buildKeyStats, buildTodayUsage, parseAndStore } from '$lib/utils/parsing';
	import { buildBookmarkletCode } from '$lib/utils/bookmarklet';
	import type { DashboardRow, FetchStatus } from '$lib/types/dashboard';

	// ── State ──
	let allRows: DashboardRow[] = $state([]);
	let token = $state('');
	let tokenPrefix = $state('');
	let fetchMonth = $state(new Date().getMonth() + 1);
	let fetchYear = $state(new Date().getFullYear());
	let isFetching = $state(false);
	let hasLoadedOnce = $state(false);
	let showResetConfirm = $state(false);
	let fetchStatus: FetchStatus = $state({ message: '', type: '' });

	// ── Derived ──
	const isConnected = $derived(token.length > 0);
	const isLoading = $derived(isFetching && !hasLoadedOnce);
	const zipCount = $derived([...new Set(allRows.map((r) => r.zipName))].length);
	const existingZipNames = $derived([...new Set(allRows.map((r) => r.zipName))]);
	const { keyList, modelTotals, grandTotal } = $derived(buildKeyStats(allRows));
	const { dailyData, dailyKeys } = $derived(buildDailyUsage(allRows));
	const { todayData, todayKeys } = $derived(buildTodayUsage(allRows));

	const detailRows = $derived(
		keyList.map((key) => {
			const rows = allRows.filter(
				(r) => r.apiKeyName === key.apiKeyName && r.apiKeyMasked === key.apiKeyMasked
			);
			const tokenTypes: Record<string, number> = {};
			for (const r of rows) {
				if (r.rowType === 'amount' && r.type) {
					tokenTypes[r.type] = (tokenTypes[r.type] || 0) + r.amount;
				}
			}
			return {
				apiKeyName: key.apiKeyName,
				apiKeyMasked: key.apiKeyMasked,
				models: key.models.join(', '),
				cost: key.cost,
				costPct: grandTotal ? ((key.cost / grandTotal) * 100).toFixed(1) : '0',
				outputTokens: tokenTypes['output_tokens'] || 0,
				inputCacheHit: tokenTypes['input_cache_hit_tokens'] || 0,
				inputCacheMiss: tokenTypes['input_cache_miss_tokens'] || 0,
				requestCount: tokenTypes['request_count'] || 0
			};
		})
	);

	const bookmarkletHref = $derived(buildBookmarkletCode());

	// ── Load token from localStorage on mount, auto-fetch if valid ──
	let autoFetched = $state(false);

	$effect(() => {
		const stored = localStorage.getItem('ds_token');
		if (stored && !token) {
			token = stored;
			tokenPrefix = stored.slice(0, 15) + '...';
			if (!autoFetched && allRows.length === 0) {
				autoFetched = true;
				fetchFromApi();
			}
		}
	});

	// ── Handlers ──
	async function onFiles(files: FileList) {
		const newRows = await handleFiles(files);
		allRows = [...allRows, ...newRows];
		hasLoadedOnce = true;
		fetchStatus = { message: '', type: '' };
	}

	function confirmReset() {
		showResetConfirm = true;
	}

	function resetAll() {
		allRows = [];
		hasLoadedOnce = false;
		fetchStatus = { message: '', type: '' };
		showResetConfirm = false;
	}

	function onTokenPaste(t: string) {
		token = t;
		tokenPrefix = t.slice(0, 15) + '...';
		localStorage.setItem('ds_token', t);
	}

	async function fetchFromApi() {
		if (!token) {
			fetchStatus = { message: 'No token. Paste it first.', type: 'error' };
			return;
		}
		isFetching = true;
		fetchStatus = { message: 'Fetching from DeepSeek API...', type: 'loading' };

		try {
			const resp = await fetch('/api/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ month: fetchMonth, year: fetchYear, token })
			});
			const data = await resp.json();
			if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

			const label = `api-${fetchYear}-${fetchMonth}`;
			const newRows: DashboardRow[] = [];
			if (data.cost) {
				newRows.push(...parseAndStore(data.cost, `cost-${fetchYear}-${fetchMonth}.csv`, label));
			}
			if (data.amount) {
				newRows.push(...parseAndStore(data.amount, `amount-${fetchYear}-${fetchMonth}.csv`, label));
			}

			allRows = newRows;
			hasLoadedOnce = true;
			fetchStatus = {
				message: `Loaded ${fetchYear}-${String(fetchMonth).padStart(2, '0')} data from API.`,
				type: 'success'
			};
		} catch (err) {
			fetchStatus = {
				message: err instanceof Error ? err.message : 'Fetch failed',
				type: 'error'
			};
		} finally {
			isFetching = false;
		}
	}
</script>

<svelte:head>
	<title>DeepSeek Usage Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<Header {zipCount} onClear={confirmReset} />

	<!-- Reset confirmation dialog -->
	{#if showResetConfirm}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
			role="dialog"
			tabindex="-1"
			aria-modal="true"
			aria-label="Confirm clear all data"
			onkeydown={(e) => { if (e.key === 'Escape') showResetConfirm = false; }}
		>
			<div class="w-full max-w-sm rounded-xl border border-border/50 bg-card p-6">
				<p class="text-sm text-foreground">
					Clear all loaded data? This cannot be undone.
				</p>
				<div class="mt-4 flex justify-end gap-3">
					<button
						class="rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
						onclick={() => { showResetConfirm = false; }}
					>
						Cancel
					</button>
					<button
						class="rounded-xl bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-all hover:bg-destructive/80"
						onclick={resetAll}
					>
						Clear All
					</button>
				</div>
			</div>
		</div>
	{/if}

	<ControlBar
		{tokenPrefix}
		{isConnected}
		{bookmarkletHref}
		{onTokenPaste}
		month={fetchMonth}
		year={fetchYear}
		isFetching={isFetching}
		status={fetchStatus}
		onMonthChange={(m) => { fetchMonth = m; }}
		onYearChange={(y) => { fetchYear = y; }}
		onFetch={fetchFromApi}
		onRetry={fetchFromApi}
		{onFiles}
		hasData={allRows.length > 0}
		existingZipNames={allRows.length > 0 ? existingZipNames : []}
	/>

	{#if allRows.length > 0}
		<SummaryCards {keyList} {modelTotals} {grandTotal} loading={isLoading} />
		<ChartSection {keyList} {modelTotals} {dailyData} {dailyKeys} {todayData} {todayKeys} loading={isLoading} />
		<KeyTable {detailRows} loading={isLoading} />
	{:else if isFetching}
		<!-- Fetching in progress — show skeleton -->
		<SummaryCards keyList={[]} modelTotals={{}} grandTotal={0} loading={true} />
		<ChartSection keyList={[]} modelTotals={{}} dailyData={[]} dailyKeys={[]} todayData={[]} todayKeys={[]} loading={true} />
		<KeyTable detailRows={[]} loading={true} />
	{:else}
		<!-- Empty state with structured onboarding -->
		<div class="mx-6 mt-10 rounded-xl border border-primary/10 bg-card p-10">
			<div class="mx-auto max-w-lg text-center">
				<svg
					class="mx-auto mb-4 size-12 text-primary/25"
					xmlns="http://www.w3.org/2000/svg"
					fill="none" viewBox="0 0 24 24"
					stroke-width="1"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
				</svg>
				<h2 class="mb-2 text-xl font-bold tracking-tight text-foreground">No usage data yet</h2>
				<p class="mb-8 text-sm text-muted-foreground">
					Get started in two ways:
				</p>

				<div class="grid gap-4 text-left sm:grid-cols-2">
					<div class="rounded-xl border border-border/40 bg-background p-4 transition-colors hover:border-primary/30">
						<div class="mb-2 text-xs font-medium text-muted-foreground">Option 1</div>
						<p class="text-sm text-foreground">
							Drag the <strong class="text-primary">DeepSeek Token</strong> bookmarklet
							to your bookmarks bar, then click it on the DeepSeek usage page.
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Token connects automatically — no paste needed.
						</p>
					</div>

					<div class="rounded-xl border border-border/40 bg-background p-4 transition-colors hover:border-primary/30">
						<div class="mb-2 text-xs font-medium text-muted-foreground">Option 2</div>
						<p class="text-sm text-foreground">
							Download your usage ZIP from
							<a
								href="https://platform.deepseek.com/usage"
								target="_blank"
								rel="noopener"
								class="text-primary underline hover:no-underline"
							>
								platform.deepseek.com/usage
							</a>
							and drop it below.
						</p>
						<p class="mt-1 text-xs text-muted-foreground">
							Or click the upload area to browse files.
						</p>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

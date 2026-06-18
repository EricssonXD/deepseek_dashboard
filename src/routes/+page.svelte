<script lang="ts">
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import TokenPanel from '$lib/components/TokenPanel.svelte';
	import FetchPanel from '$lib/components/FetchPanel.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import ChartSection from '$lib/components/ChartSection.svelte';
	import KeyTable from '$lib/components/KeyTable.svelte';
	import { handleFiles, buildDailyUsage, buildKeyStats, parseAndStore } from '$lib/utils/parsing';
	import { buildBookmarkletCode } from '$lib/utils/bookmarklet';
	import type { DashboardRow, FetchStatus } from '$lib/types/dashboard';

	// ── State ──
	let allRows: DashboardRow[] = $state([]);
	let token = $state('');
	let tokenPrefix = $state('');
	let fetchMonth = $state(new Date().getMonth() + 1);
	let fetchYear = $state(new Date().getFullYear());
	let isFetching = $state(false);
	let fetchStatus: FetchStatus = $state({ message: '', type: '' });

	// ── Derived ──
	const isConnected = $derived(token.length > 0);
	const zipCount = $derived([...new Set(allRows.map((r) => r.zipName))].length);
	const { keyList, modelTotals, grandTotal } = $derived(buildKeyStats(allRows));
	const { dailyData, dailyKeys } = $derived(buildDailyUsage(allRows));

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

	const bookmarkletHref = $derived(buildBookmarkletCode($page.url.origin));

	// ── Token polling ──
	async function checkStoredToken() {
		try {
			const resp = await fetch('/api/get-token');
			const data = await resp.json();
			if (data.token) {
				token = data.token;
				tokenPrefix = data.prefix || data.token.slice(0, 20) + '...';
				return true;
			}
		} catch {
			// server not running
		}
		return false;
	}

	$effect(() => {
		const interval = setInterval(async () => {
			if (!isConnected) await checkStoredToken();
		}, 3000);
		return () => clearInterval(interval);
	});

	// ── Handlers ──
	async function onFiles(files: FileList) {
		const newRows = await handleFiles(files);
		allRows = [...allRows, ...newRows];
		fetchStatus = { message: '', type: '' };
	}

	function resetAll() {
		allRows = [];
		fetchStatus = { message: '', type: '' };
	}

	async function onTokenPaste(t: string) {
		try {
			const resp = await fetch('/api/set-token', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: t })
			});
			const data = await resp.json();
			if (resp.ok) {
				token = t;
				tokenPrefix = data.prefix || t.slice(0, 20) + '...';
			}
		} catch (err) {
			console.error('Failed to save token:', err);
		}
	}

	async function fetchFromApi() {
		if (!token) {
			fetchStatus = { message: 'No token. Use bookmarklet or paste manually.', type: 'error' };
			return;
		}
		isFetching = true;
		fetchStatus = { message: 'Fetching from DeepSeek API...', type: 'loading' };

		try {
			const resp = await fetch('/api/fetch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ month: fetchMonth, year: fetchYear })
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
	<Header {zipCount} onClear={resetAll} />

	<TokenPanel {tokenPrefix} {isConnected} {bookmarkletHref} {onTokenPaste} />

	<FetchPanel
		month={fetchMonth}
		year={fetchYear}
		isDisabled={isFetching || !isConnected}
		status={fetchStatus}
		onMonthChange={(m) => {
			fetchMonth = m;
		}}
		onYearChange={(y) => {
			fetchYear = y;
		}}
		onFetch={fetchFromApi}
	/>

	<DropZone {onFiles} hasData={allRows.length > 0} />

	<!-- Download link -->
	<div class="px-6 pb-2 pt-2 text-center">
		<a
			href="https://platform.deepseek.com/usage"
			target="_blank"
			rel="noopener"
			class="inline-block rounded-md border border-border px-4 py-1.5 text-sm text-primary no-underline transition-colors hover:bg-muted"
		>
			Download export from platform.deepseek.com/usage
		</a>
	</div>

	{#if allRows.length > 0}
		<SummaryCards {keyList} {modelTotals} {grandTotal} />
		<ChartSection {keyList} {modelTotals} {dailyData} {dailyKeys} />
		<KeyTable {detailRows} />
	{:else}
		<div class="py-20 text-center text-muted-foreground/50">
			<div class="text-6xl">📊</div>
			<p class="mt-3">Upload a zip file to see usage data</p>
		</div>
	{/if}
</div>

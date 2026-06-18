<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { FetchStatus } from '$lib/types/dashboard';

	let {
		month,
		year,
		isDisabled = false,
		status = { message: '', type: '' },
		onMonthChange,
		onYearChange,
		onFetch
	}: {
		month: number;
		year: number;
		isDisabled: boolean;
		status: FetchStatus;
		onMonthChange: (m: number) => void;
		onYearChange: (y: number) => void;
		onFetch: () => void;
	} = $props();

	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	const years = [2025, 2026, 2027];
</script>

<div class="mx-6 mt-4 rounded-lg border border-border bg-card p-4">
	<div class="flex flex-wrap items-end gap-3">
		<div>
			<label
				for="fetchMonth"
				class="mb-1 block text-xs uppercase tracking-wide text-muted-foreground"
			>
				Month
			</label>
			<select
				id="fetchMonth"
				class="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
				value={month}
				onchange={(e) => onMonthChange(Number(e.currentTarget.value))}
			>
				{#each months as m}
					<option value={m}>{m}</option>
				{/each}
			</select>
		</div>

		<div>
			<label
				for="fetchYear"
				class="mb-1 block text-xs uppercase tracking-wide text-muted-foreground"
			>
				Year
			</label>
			<select
				id="fetchYear"
				class="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
				value={year}
				onchange={(e) => onYearChange(Number(e.currentTarget.value))}
			>
				{#each years as y}
					<option value={y}>{y}</option>
				{/each}
			</select>
		</div>

		<Button onclick={onFetch} disabled={isDisabled}>
			{status.type === 'loading' ? 'Fetching...' : 'Fetch from API'}
		</Button>
	</div>

	{#if status.message}
		<p
			class="mt-2 text-xs"
			class:text-success={status.type === 'success'}
			class:text-destructive={status.type === 'error'}
			class:text-muted-foreground={status.type !== 'success' && status.type !== 'error'}
		>
			{status.message}
		</p>
	{/if}
</div>

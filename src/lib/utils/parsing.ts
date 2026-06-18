import Papa from 'papaparse';
import JSZip from 'jszip';
import type { DailyKeyUsage, DashboardRow, KeySummary } from '$lib/types/dashboard';

export function parseAndStore(csvText: string, csvName: string, zipName: string): DashboardRow[] {
	const result = Papa.parse<Record<string, string>>(csvText, {
		header: true,
		skipEmptyLines: true,
		dynamicTyping: false
	});

	if (!result.data.length) return [];

	const isCost = csvName.toLowerCase().startsWith('cost');
	const isAmount = csvName.toLowerCase().startsWith('amount');
	const rows: DashboardRow[] = [];

	for (const row of result.data) {
		const apiKeyMasked = row['api_key'] || '';
		const apiKeyName = row['api_key_name'] || '';
		const userId = row['user_id'] || row['﻿user_id'] || '';
		const utcDate = row['utc_date'] || '';
		const model = row['model'] || '';
		const type = row['type'] || '';
		const price = parseFloat(row['price']) || 0;
		const amount = parseFloat(row['amount']) || 0;

		if (isCost) {
			rows.push({
				zipName,
				csvName,
				userId,
				utcDate,
				model,
				walletType: row['wallet_type'] || '',
				cost: parseFloat(row['cost']) || 0,
				currency: row['currency'] || 'USD',
				apiKeyMasked: 'N/A',
				apiKeyName: 'N/A',
				type: 'cost',
				price: 0,
				amount: 0,
				rowType: 'cost'
			});
		} else if (isAmount) {
			rows.push({
				zipName,
				csvName,
				userId,
				utcDate,
				model,
				walletType: '',
				cost: price * amount,
				currency: 'USD',
				apiKeyMasked,
				apiKeyName,
				type,
				price,
				amount,
				rowType: 'amount'
			});
		}
	}

	return rows;
}

export async function handleFiles(files: FileList): Promise<DashboardRow[]> {
	const allRows: DashboardRow[] = [];

	for (const file of files) {
		if (!file.name.endsWith('.zip')) continue;
		try {
			const zip = await JSZip.loadAsync(file);
			const csvFiles = Object.keys(zip.files).filter((f) => f.endsWith('.csv'));
			for (const csvName of csvFiles) {
				const content = await zip.files[csvName].async('string');
				const rows = parseAndStore(content, csvName, file.name);
				allRows.push(...rows);
			}
		} catch (err) {
			console.error('Failed to read zip:', file.name, err);
		}
	}

	return allRows;
}

export function buildKeyStats(allRows: DashboardRow[]) {
	const keyMap: Record<string, KeySummary> = {};
	const modelTotals: Record<string, number> = {};
	let grandTotal = 0;

	for (const row of allRows) {
		if (row.rowType !== 'amount') continue;
		grandTotal += row.cost;
		modelTotals[row.model] = (modelTotals[row.model] || 0) + row.cost;
		const key = row.apiKeyMasked + '|' + row.apiKeyName;
		if (!keyMap[key]) {
			keyMap[key] = {
				apiKeyMasked: row.apiKeyMasked,
				apiKeyName: row.apiKeyName,
				cost: 0,
				models: []
			};
		}
		keyMap[key].cost += row.cost;
		if (!keyMap[key].models.includes(row.model)) {
			keyMap[key].models.push(row.model);
		}
	}

	const keyList = Object.values(keyMap)
		.map((k) => ({ ...k, models: [...k.models].sort() }))
		.sort((a, b) => b.cost - a.cost);

	return { keyList, modelTotals, grandTotal };
}

export function buildDailyUsage(
	allRows: DashboardRow[],
	topKeyCount = 6
): { dailyData: DailyKeyUsage[]; dailyKeys: string[] } {
	// Find top keys by total cost (amount rows only)
	const keyCosts: Record<string, number> = {};
	for (const row of allRows) {
		if (row.rowType !== 'amount') continue;
		const label = row.apiKeyName || row.apiKeyMasked;
		keyCosts[label] = (keyCosts[label] || 0) + row.cost;
	}
	const topKeys = Object.entries(keyCosts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, topKeyCount)
		.map(([k]) => k);

	// Group by date + key
	const dateMap: Record<string, Record<string, number>> = {};
	for (const row of allRows) {
		if (row.rowType !== 'amount') continue;
		const label = row.apiKeyName || row.apiKeyMasked;
		if (!topKeys.includes(label)) continue;
		const date = row.utcDate.slice(0, 10); // YYYY-MM-DD
		if (!dateMap[date]) dateMap[date] = {};
		dateMap[date][label] = (dateMap[date][label] || 0) + row.cost;
	}

	// Build sorted data array
	const entries = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b));
	if (entries.length === 0) return { dailyData: [], dailyKeys: topKeys };

	const minDate = new Date(entries[0][0] + 'T00:00:00');
	const maxDate = new Date(entries[entries.length - 1][0] + 'T00:00:00');

	// Fill all dates in range, setting missing keys to 0
	const dailyData: DailyKeyUsage[] = [];
	const cursor = new Date(minDate);
	const zeroKeys = Object.fromEntries(topKeys.map((k) => [k, 0]));
	while (cursor <= maxDate) {
		const dateStr = cursor.toISOString().slice(0, 10);
		const existing = dateMap[dateStr] ?? {};
		dailyData.push({
			date: new Date(cursor),
			...zeroKeys,
			...existing
		});
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}

	return { dailyData, dailyKeys: topKeys };
}

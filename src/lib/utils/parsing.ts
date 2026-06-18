import Papa from 'papaparse';
import JSZip from 'jszip';
import type { DashboardRow, KeySummary } from '$lib/types/dashboard';

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

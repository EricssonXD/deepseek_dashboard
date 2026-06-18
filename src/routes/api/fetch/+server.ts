import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import JSZip from 'jszip';
import { storedToken } from '../token-store';

const EXPORT_URL = 'https://platform.deepseek.com/api/v0/usage/export';
const SUMMARY_URL = 'https://platform.deepseek.com/api/v0/users/get_user_summary';
const CSV_COLS = ['utc_date', 'model', 'api_key', 'api_key_name', 'type', 'price', 'amount', 'cost'];

function log(msg: string) {
	console.log(`[fetch] ${msg}`);
}

async function apiFetch(url: string, token: string) {
	return fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(30000)
	});
}

function parseSummary(raw: string) {
	try {
		const data = JSON.parse(raw);
		const biz = data?.data?.biz_data || {};
		const wallets = biz.normal_wallets || [];
		const balance = Number(wallets[0]?.balance ?? 0);
		const costs = biz.monthly_costs || [];
		const monthlyCost = Number(costs[0]?.amount ?? 0);
		return { balance, monthlyCost };
	} catch {
		return { balance: 0, monthlyCost: 0 };
	}
}

function normalizeCostCSV(raw: string, keyLookup: Map<string, [string, string]>): string {
	const lines = raw.split('\n');
	const header = lines[0].split(',').map((h) => h.trim().replace(/^﻿/, '')); // strip BOM
	const userIdIdx = header.findIndex((h) => h === 'user_id');
	const dateIdx = header.findIndex((h) => h === 'utc_date');
	const modelIdx = header.findIndex((h) => h === 'model');
	const costIdx = header.findIndex((h) => h === 'cost');

	if (userIdIdx < 0) return ''; // can't normalize without user_id

	const rows: string[] = [CSV_COLS.join(',')];
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		const cols = line.split(',');
		const uid = cols[userIdIdx] || '';
		const [masked, name] = keyLookup.get(uid) || ['N/A', 'N/A'];
		rows.push(
			[cols[dateIdx] || '', cols[modelIdx] || '', masked, name, 'cost', '0', '0', cols[costIdx] || '0'].join(',')
		);
	}
	return rows.join('\n');
}

export const POST: RequestHandler = async ({ request }) => {
	let token = storedToken;

	let month: string;
	let year: string;
	try {
		const body = await request.json();
		month = String(body.month || 1);
		year = String(body.year || 2026);
		// Fallback: body token
		if (!token && body.token) token = String(body.token).trim();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (!token) {
		return json(
			{ error: 'No token stored. Use bookmarklet or paste token first.' },
			{ status: 400 }
		);
	}

	if (token.toLowerCase().startsWith('bearer ')) {
		token = token.slice(7).trim();
	}

	const tokenPreview = token.slice(0, 10) + '...' + token.slice(-6);
	log(`fetching export ${year}-${month} token=${tokenPreview}`);

	// 1. Fetch export ZIP
	let zipBytes: ArrayBuffer;
	try {
		const url = `${EXPORT_URL}?month=${month}&year=${year}`;
		log(`→ ${url}`);
		const resp = await apiFetch(url, token);
		if (!resp.ok) {
			const text = await resp.text().catch(() => '');
			log(`← ${resp.status}: ${text.slice(0, 200)}`);
			if (text.startsWith('{') && text.includes('"code"')) {
				try {
					const err = JSON.parse(text);
					return json(
						{ error: `DeepSeek: ${err.msg || 'unknown'} (code ${err.code})` },
						{ status: 502 }
					);
				} catch {/* not JSON */}
			}
			return json(
				{ error: `DeepSeek export ${resp.status}: ${text.slice(0, 300)}` },
				{ status: 502 }
			);
		}
		zipBytes = await resp.arrayBuffer();
		log(`← ${resp.status} ${zipBytes.byteLength} bytes`);
	} catch (err) {
		return json(
			{ error: `Export fetch failed: ${err instanceof Error ? err.message : 'unknown'}` },
			{ status: 502 }
		);
	}

	// 2. Process ZIP
	const zip = await JSZip.loadAsync(zipBytes);
	const keyLookup = new Map<string, [string, string]>();
	let costRaw = '';
	let amountRaw = '';

	for (const [name, file] of Object.entries(zip.files)) {
		const content = await file.async('string');
		if (name.toLowerCase().includes('amount')) {
			amountRaw = content;
			const lines = content.split('\n');
			const header = lines[0].split(',').map((h) => h.trim().replace(/^﻿/, ''));
			const userIdIdx = header.findIndex((h) => h === 'user_id');
			const apiKeyIdx = header.findIndex((h) => h === 'api_key');
			const nameIdx = header.findIndex((h) => h === 'api_key_name');
			if (userIdIdx >= 0 && apiKeyIdx >= 0 && nameIdx >= 0) {
				for (let i = 1; i < lines.length; i++) {
					const cols = lines[i].split(',');
					const uid = cols[userIdIdx]?.trim();
					if (uid && !keyLookup.has(uid)) {
						keyLookup.set(uid, [cols[apiKeyIdx]?.trim() || uid, cols[nameIdx]?.trim() || uid]);
					}
				}
			}
		} else if (name.toLowerCase().includes('cost')) {
			costRaw = content;
		}
	}

	if (!amountRaw) {
		return json({ error: 'No amount data found in export ZIP' }, { status: 502 });
	}

	// Normalize amount CSV
	const amountLines = amountRaw.split('\n');
	const amtHeader = amountLines[0].split(',').map((h) => h.trim().replace(/^﻿/, ''));
	const amtColMap = new Map<string, number>();
	amtHeader.forEach((h, i) => amtColMap.set(h, i));

	const getCol = (name: string) => amtColMap.get(name) ?? -1;
	const amountRows: string[] = [CSV_COLS.join(',')];
	for (let i = 1; i < amountLines.length; i++) {
		const line = amountLines[i].trim();
		if (!line) continue;
		const cols = line.split(',');
		amountRows.push(
			[
				cols[getCol('utc_date')] || '',
				cols[getCol('model')] || '',
				cols[getCol('api_key')] || '',
				cols[getCol('api_key_name')] || '',
				cols[getCol('type')] || '',
				cols[getCol('price')] || '0',
				cols[getCol('amount')] || '0',
				'0'
			].join(',')
		);
	}
	const amountCSV = amountRows.join('\n');

	// Normalize cost CSV
	const costCSV = costRaw ? normalizeCostCSV(costRaw, keyLookup) : '';

	// 3. Fetch summary
	let balance = 0;
	let monthlyCost = 0;
	try {
		const summaryResp = await apiFetch(SUMMARY_URL, token);
		if (summaryResp.ok) {
			const raw = await summaryResp.text();
			const s = parseSummary(raw);
			balance = s.balance;
			monthlyCost = s.monthlyCost;
		}
	} catch (e) {
		log(`summary fetch failed (non-fatal): ${e}`);
	}

	const amtLines = amountCSV.split('\n').length - 1;
	const costLines = costCSV ? costCSV.split('\n').length - 1 : 0;
	log(
		`export: ${keyLookup.size} keys, ${amtLines} amount rows, ${costLines} cost rows  balance=$${balance.toFixed(2)}`
	);

	return json({
		cost: costCSV,
		amount: amountCSV,
		balance,
		monthly_cost: monthlyCost
	});
};

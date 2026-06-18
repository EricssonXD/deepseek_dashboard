import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = 'https://platform.deepseek.com/api/v0/usage';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const token = cookies.get('ds_token');
	if (!token) {
		return json({ error: 'Bearer token required — set token first via bookmarklet' }, { status: 400 });
	}

	let month: string;
	let year: string;
	try {
		const body = await request.json();
		month = String(body.month || 1);
		year = String(body.year || 2026);
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const results: Record<string, string> = {};

	for (const kind of ['cost', 'amount'] as const) {
		const url = `${API_BASE}/${kind}?month=${month}&year=${year}`;
		try {
			const resp = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(30000)
			});
			if (!resp.ok) {
				const body = await resp.text().catch(() => '');
				return json(
					{ error: `DeepSeek API ${resp.status}: ${body.slice(0, 300)}` },
					{ status: 502 }
				);
			}
			results[kind] = await resp.text();
		} catch (err) {
			return json(
				{ error: `Fetch failed: ${err instanceof Error ? err.message : 'unknown'}` },
				{ status: 502 }
			);
		}
	}

	return json({ cost: results.cost, amount: results.amount });
};

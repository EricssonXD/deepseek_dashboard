import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const API_BASE = 'https://platform.deepseek.com/api/v0/usage';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let token = cookies.get('ds_token');

	let month: string;
	let year: string;
	try {
		const body = await request.json();
		month = String(body.month || 1);
		year = String(body.year || 2026);
		// Fallback: accept token from request body if cookie not present
		if (!token && body.token) token = String(body.token).trim();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	if (!token) {
		return json(
			{ error: 'Bearer token required — set token first via bookmarklet or paste' },
			{ status: 400 }
		);
	}

	const results: Record<string, string> = {};

	const tokenPreview = token.slice(0, 10) + '...' + token.slice(-6);
	console.log(`[fetch] token=${tokenPreview} month=${month} year=${year}`);

	for (const kind of ['cost', 'amount'] as const) {
		const url = `${API_BASE}/${kind}?month=${month}&year=${year}`;
		try {
			console.log(`[fetch] → ${url}`, `Authorization: Bearer ${tokenPreview}`);
			const resp = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
				signal: AbortSignal.timeout(30000)
			});
			const text = await resp.text();
			console.log(`[fetch] ← ${resp.status} body[0:100]: ${text.slice(0, 100)}`);

			// DeepSeek returns HTTP 200 with JSON error for auth failures
			if (text.startsWith('{') && text.includes('"code"')) {
				try {
					const err = JSON.parse(text);
					if (err.code && err.msg) {
						return json(
							{ error: `DeepSeek: ${err.msg} (code ${err.code})` },
							{ status: 502 }
						);
					}
				} catch { /* not JSON, continue as CSV */ }
			}

			if (!resp.ok) {
				return json(
					{ error: `DeepSeek HTTP ${resp.status}: ${text.slice(0, 300)}` },
					{ status: 502 }
				);
			}

			results[kind] = text;
		} catch (err) {
			return json(
				{ error: `Fetch failed: ${err instanceof Error ? err.message : 'unknown'}` },
				{ status: 502 }
			);
		}
	}

	return json({ cost: results.cost, amount: results.amount });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getToken } from '../token-store';
import { getSessionId } from '../session';

const SUMMARY_URL = 'https://platform.deepseek.com/api/v0/users/get_user_summary';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const sid = getSessionId(cookies, url);
	const token = getToken(sid);

	if (!token) {
		return json({ connected: false, sid });
	}

	try {
		const resp = await fetch(SUMMARY_URL, {
			headers: { Authorization: `Bearer ${token}` },
			signal: AbortSignal.timeout(10000)
		});

		if (!resp.ok) {
			const text = await resp.text().catch(() => '');
			console.log(`[check-token] token rejected (${resp.status}): ${text.slice(0, 100)}`);
			return json({ connected: false, sid, error: `Token rejected (${resp.status})` });
		}

		const raw = await resp.text();
		let balance = 0;
		let monthlyCost = 0;
		try {
			const data = JSON.parse(raw);
			const biz = data?.data?.biz_data || {};
			const wallets = biz.normal_wallets || [];
			balance = Number(wallets[0]?.balance ?? 0);
			const costs = biz.monthly_costs || [];
			monthlyCost = Number(costs[0]?.amount ?? 0);
		} catch { /* non-fatal */ }

		const prefix = token.slice(0, 15) + '...';
		console.log(`[check-token] valid, balance=$${balance.toFixed(2)} monthly=$${monthlyCost.toFixed(2)}`);
		return json({ connected: true, prefix, sid, balance, monthly_cost: monthlyCost });
	} catch (err) {
		console.log(`[check-token] network error: ${err}`);
		return json({ connected: true, prefix: token.slice(0, 15) + '...', sid, warning: 'Could not reach DeepSeek' });
	}
};

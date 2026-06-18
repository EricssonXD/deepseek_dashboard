import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storedToken, setToken } from '../token-store';

const SUMMARY_URL = 'https://platform.deepseek.com/api/v0/users/get_user_summary';

export const GET: RequestHandler = async () => {
	if (!storedToken) {
		return json({ connected: false });
	}

	try {
		const resp = await fetch(SUMMARY_URL, {
			headers: { Authorization: `Bearer ${storedToken}` },
			signal: AbortSignal.timeout(10000)
		});

		if (!resp.ok) {
			// Token invalid — clear it
			setToken('');
			const text = await resp.text().catch(() => '');
			console.log(`[check-token] token rejected (${resp.status}): ${text.slice(0, 100)}`);
			return json({ connected: false, error: `Token rejected by DeepSeek (${resp.status})` });
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

		const prefix = storedToken.slice(0, 15) + '...';
		console.log(`[check-token] valid, balance=$${balance.toFixed(2)} monthly=$${monthlyCost.toFixed(2)}`);
		return json({ connected: true, prefix, balance, monthly_cost: monthlyCost });
	} catch (err) {
		// Network error — keep token, assume server issue
		console.log(`[check-token] network error: ${err}`);
		return json({
			connected: true,
			prefix: storedToken.slice(0, 15) + '...',
			warning: 'Could not reach DeepSeek to validate token'
		});
	}
};

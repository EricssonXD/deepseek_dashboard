import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setToken } from '../token-store';
import { getSessionId } from '../session';

function corsHeaders(origin: string | null) {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Credentials': 'true'
	};
}

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const origin = request.headers.get('origin');
	const sid = getSessionId(cookies, url);

	try {
		const body = await request.json();
		let token = (body.token || '').trim();
		if (!token) {
			return json({ error: 'Token required' }, { status: 400, headers: corsHeaders(origin) });
		}
		if (token.toLowerCase().startsWith('bearer ')) {
			token = token.slice(7).trim();
		}

		setToken(sid, token);
		console.log(`[set-token] sid=${sid.slice(0, 8)} prefix=${token.slice(0, 10)}... len=${token.length}`);

		const prefix = token.slice(0, 15) + '...';
		return json({ ok: true, prefix }, { headers: corsHeaders(origin) });
	} catch {
		return json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders(origin) });
	}
};

export const OPTIONS: RequestHandler = async ({ request, cookies, url }) => {
	const origin = request.headers.get('origin');
	getSessionId(cookies, url); // ensure session cookie is set
	return new Response(null, { status: 204, headers: corsHeaders(origin) });
};

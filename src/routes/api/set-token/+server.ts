import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type'
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const token = (body.token || '').trim();
		if (!token) {
			return json({ error: 'Token required' }, { status: 400, headers: CORS_HEADERS });
		}

		cookies.set('ds_token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 30
		});

		const prefix = token.slice(0, 20) + '...';
		return json({ ok: true, prefix }, { headers: CORS_HEADERS });
	} catch {
		return json({ error: 'Invalid request' }, { status: 400, headers: CORS_HEADERS });
	}
};

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, { status: 204, headers: CORS_HEADERS });
};

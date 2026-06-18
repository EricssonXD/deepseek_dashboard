import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function corsHeaders(origin: string | null) {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Credentials': 'true'
	};
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const origin = request.headers.get('origin');

	try {
		const body = await request.json();
		let token = (body.token || '').trim();
		if (!token) {
			return json({ error: 'Token required' }, { status: 400, headers: corsHeaders(origin) });
		}
		if (token.toLowerCase().startsWith('bearer ')) {
			token = token.slice(7).trim();
		}

		console.log(`[set-token] prefix=${token.slice(0, 10)}... len=${token.length}`);

		cookies.set('ds_token', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false,
			maxAge: 60 * 60 * 24 * 30
		});

		const prefix = token.slice(0, 20) + '...';
		return json({ ok: true, prefix }, { headers: corsHeaders(origin) });
	} catch {
		return json({ error: 'Invalid request' }, { status: 400, headers: corsHeaders(origin) });
	}
};

export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin');
	return new Response(null, {
		status: 204,
		headers: corsHeaders(origin)
	});
};

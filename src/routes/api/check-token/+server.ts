import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('ds_token');
	if (token) {
		const prefix = token.slice(0, 20) + '...';
		return json({ connected: true, prefix });
	}
	return json({ connected: false });
};

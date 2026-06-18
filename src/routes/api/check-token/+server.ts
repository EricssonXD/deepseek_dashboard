import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { storedToken } from '../token-store';

export const GET: RequestHandler = async () => {
	if (storedToken) {
		const prefix = storedToken.slice(0, 15) + '...';
		return json({ connected: true, prefix });
	}
	return json({ connected: false });
};

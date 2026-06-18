import type { Cookies } from '@sveltejs/kit';

const SID_COOKIE = 'ds_sid';

/** Get or create session ID. Checks cookie first, then query param. */
export function getSessionId(cookies: Cookies, url: URL): string {
	// 1. Cookie (same-origin dashboard + manual paste)
	let sid = cookies.get(SID_COOKIE);

	// 2. Query param (bookmarklet cross-origin)
	if (!sid) {
		sid = url.searchParams.get('sid') || undefined;
	}

	// 3. Create new session
	if (!sid) {
		sid = crypto.randomUUID();
	}

	// Persist via cookie
	cookies.set(SID_COOKIE, sid, {
		path: '/',
		httpOnly: false, // bookmarklet needs to read it via document.cookie? No — it's in the URL.
		sameSite: 'lax',
		secure: false,
		maxAge: 60 * 60 * 24
	});

	return sid;
}

// Session-scoped token store.
// Each browser session gets its own token, keyed by session ID.
// Survives across requests within the same process.
// Resets on server restart.

const tokens = new Map<string, string>();

export function getToken(sessionId: string | null): string | null {
	if (!sessionId) return null;
	return tokens.get(sessionId) || null;
}

export function setToken(sessionId: string, token: string) {
	if (token) {
		tokens.set(sessionId, token);
	} else {
		tokens.delete(sessionId);
	}
}

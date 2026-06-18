// Server-side in-memory token store.
// Survives across requests within the same process (like Python server).
// Resets on server restart.

export let storedToken: string | null = null;

export function setToken(token: string) {
	storedToken = token;
}

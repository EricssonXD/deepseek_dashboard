# DeepSeek Dashboard — Core

Monorepo: SvelteKit 5 frontend + Python stdlib API proxy.

## Source map

| Path          | Role                                                                                  |
| ------------- | ------------------------------------------------------------------------------------- |
| `src/`        | SvelteKit app (routes, lib)                                                           |
| `src/routes/` | Page routes + layouts                                                                 |
| `src/lib/`    | Shared components, utilities                                                          |
| `server.py`   | Python HTTP proxy for DeepSeek API (`/api/fetch`, `/api/set-token`, `/api/get-token`) |
| `static/`     | Static assets (robots.txt)                                                            |
| `index.html`  | Legacy single-page dashboard — to be migrated into SvelteKit                          |
| `temp/`       | Temporary files (gitignored)                                                          |

## Invariants

- Svelte 5 runes mode enforced via vite config (not per-file opt-in)
- Adapter-static — SPA mode, no SSR
- Bun is package manager
- Python server proxies ALL DeepSeek API calls (no direct browser-to-DeepSeek calls)
- API token stored in-memory on Python server (not persisted to disk)
- Zip/CSV parsing happens client-side via JSZip + PapaParse

See: `mem:tech_stack`, `mem:conventions`, `mem:suggested_commands`

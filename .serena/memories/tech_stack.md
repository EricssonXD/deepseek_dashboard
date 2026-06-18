# Tech Stack

## Frontend

- **Framework:** SvelteKit 5 (runes mode, `$state`, `$derived`, `$effect`, `$props`)
- **Adapter:** `@sveltejs/adapter-static` (SPA)
- **Language:** TypeScript 6.0 (strict mode)
- **Styling:** Tailwind CSS 4 (`@tailwindcss/vite` plugin)
- **Charts:** Chart.js 4.4 (UMD in legacy; will use npm package)
- **CSV/Zip:** PapaParse 5.4 + JSZip 3.10 (legacy CDN; will use npm packages)
- **UI primitives:** shadcn-svelte (to be added)
- **Package manager:** bun
- **Lint:** ESLint 10 + prettier 3
- **Vite:** 8.x

## Backend (API proxy)

- **Runtime:** Python 3 (stdlib only — `http.server`, `urllib.request`, `json`)
- **Port:** 8765 (default)
- **Endpoints:** `POST /api/fetch`, `POST /api/set-token`, `GET /api/get-token`

## Key versions

- svelte: ^5.56.1
- @sveltejs/kit: ^2.63.0
- typescript: ^6.0.3
- tailwindcss: ^4.3.0
- vite: ^8.0.16

See: `mem:core`

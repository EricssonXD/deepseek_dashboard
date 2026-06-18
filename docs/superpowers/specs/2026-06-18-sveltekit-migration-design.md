# SvelteKit Migration — DeepSeek Dashboard

**Date:** 2026-06-18
**Status:** Draft

## Goal

Migrate the single-file `index.html` dashboard into a SvelteKit 5 (runes mode) application with shadcn-svelte UI components. The Python API proxy (`server.py`) remains unchanged.

## Architecture

### Component Tree

```
+layout.svelte          — root layout (dark theme, metadata, favicon)
└── +page.svelte        — dashboard orchestrator (state, data flow)
    ├── Header            — title, file count badge, "Clear All" button
    ├── TokenPanel        — bookmarklet link, status indicator, manual paste
    ├── FetchPanel        — month/year selects, "Fetch from API" button, status msg
    ├── DropZone          — ZIP drag-and-drop + click-to-upload area
    ├── SummaryCards      — 4 stat cards (Total Cost, API Keys, Models, Top Key)
    ├── ChartSection      — Chart.js bar (per-key) + doughnut (per-model)
    └── KeyTable          — API Key Breakdown table with token details
```

### Data Flow

- **Single source of truth:** All state (`allRows`, token, month/year, fetch status) lives in `+page.svelte` via `$state` runes.
- **Props down:** Child components are pure presentational — they receive data and callbacks as props.
- **No stores:** Svelte stores unnecessary for single-page scope. Runes handle reactivity.
- **Parsing utility:** `$lib/utils/parsing.ts` — extracted from `index.html` JS logic (JSZip + PapaParse → typed row objects).
- **Chart lifecycle:** `$effect` in `ChartSection` creates/destroys Chart.js instances when data changes.
- **Bookmarklet:** Built in `$lib/utils/bookmarklet.ts` — uses `window.location.origin` for dynamic URL.

### Route Design

Single-page app (SPA) — one route:

| Route | File                      | Purpose   |
| ----- | ------------------------- | --------- |
| `/`   | `src/routes/+page.svelte` | Dashboard |

`adapter-static` with fallback to `index.html` for SPA mode.

## Component Specifications

### 1. `+layout.svelte` (modify existing)

- Wrap in dark background (`bg-[#0d1117] text-[#c9d1d9]`)
- Import Tailwind CSS (`layout.css`)
- Set `<svelte:head>` title: "DeepSeek Usage Dashboard"
- Favicon already wired

### 2. `+page.svelte` — Dashboard Orchestrator

State (all `$state`):

- `allRows: DashboardRow[]`
- `token: string | null`
- `tokenPrefix: string`
- `fetchMonth: number`
- `fetchYear: number`
- `fetchStatus: { message: string; type: 'success' | 'error' | 'loading' | '' }`

Functions:

- `handleFiles(files: FileList)` — ZIP parsing loop
- `parseAndStore(csvText, csvName, zipName)` — CSV → rows
- `resetAll()` — clear all state
- `fetchFromApi()` — POST /api/fetch → parse response
- `checkStoredToken()` — GET /api/get-token → update token state
- `buildKeyStats()` — derived: computes keyList, modelTotals, grandTotal

### 3. Header

Props: `zipCount: number`, `onClear: () => void`

Renders title, file count pill, "Clear All" button (shadcn Button variant="outline").

### 4. TokenPanel

Props:

- `tokenPrefix: string`
- `isConnected: boolean`
- `bookmarkletHref: string`
- `onTokenPaste: (token: string) => void`

Features:

- Status indicator (green dot = connected, red = not)
- Bookmarklet draggable link (shadcn Button with special styling)
- Collapsible manual paste input (details/summary with password input)
- Auto-polling via `$effect` (3s interval when disconnected)

### 5. FetchPanel

Props:

- `month: number`
- `year: number`
- `onFetch: () => void`
- `status: { message: string; type: string }`
- `isFetching: boolean`
- `onMonthChange: (m: number) => void`
- `onYearChange: (y: number) => void`

Uses shadcn Select for month/year dropdowns and Button for fetch.

### 6. DropZone

Props: `onFiles: (files: FileList) => void`

Drag-and-drop zone with:

- Dashed border, hover/dragover highlight
- Click triggers hidden file input
- Accepts `.zip` files, `multiple`
- Uses Tailwind for styling (border-dashed, hover:border-blue)

### 7. SummaryCards

Props: `keyList: KeySummary[]`, `modelTotals: Record<string, number>`, `grandTotal: number`

4 shadcn Cards in responsive grid:

- Total Cost (USD)
- API Keys (count + top name)
- Models Used (count + top model)
- Top API Key Cost (amount + name)

### 8. ChartSection

Props: `keyList: KeySummary[]`, `modelTotals: Record<string, number>`

- Bar chart: Cost per API Key (top 15), `$effect` creates Chart.js bar instance
- Doughnut chart: Cost per Model, `$effect` creates Chart.js doughnut instance
- Cleanup on destroy via `$effect` return callback
- Wrap canvases in shadcn Card components

### 9. KeyTable

Props: `detailRows: KeyDetail[]`

shadcn Table with columns:

- API Key Name, Key (masked), Models (Badge per model), Cost, Share %, Output Tokens, Cache Hit, Cache Miss, Requests

## Dependencies to Add

```bash
bun add chart.js jszip papaparse
bun add -D @types/papaparse
```

## shadcn-svelte Components

```bash
npx shadcn-svelte@latest add card button table badge select
```

Components used:

- **Card**: Summary cards, chart wrappers
- **Button**: Clear All, Fetch from API, bookmarklet link
- **Table**: API Key Breakdown
- **Badge**: Model names in table
- **Select**: Month/Year dropdowns

## Typedefs (`$lib/types/dashboard.ts`)

```ts
interface DashboardRow {
	zipName: string;
	csvName: string;
	userId: string;
	utcDate: string;
	model: string;
	walletType: string;
	cost: number;
	currency: string;
	apiKeyMasked: string;
	apiKeyName: string;
	type: string;
	price: number;
	amount: number;
	rowType: 'cost' | 'amount';
}

interface KeySummary {
	apiKeyMasked: string;
	apiKeyName: string;
	cost: number;
	models: string[];
}

interface KeyDetail {
	apiKeyName: string;
	apiKeyMasked: string;
	models: string;
	cost: number;
	costPct: string;
	outputTokens: number;
	inputCacheHit: number;
	inputCacheMiss: number;
	requestCount: number;
}
```

## Theme

Dark-only dashboard (no light mode toggle). Colors match GitHub dark palette:

- Background: `#0d1117`
- Surface: `#161b22`
- Border: `#30363d`
- Text primary: `#f0f6fc` / `#c9d1d9`
- Text muted: `#8b949e`
- Accent: `#58a6ff`
- Success: `#3fb950`
- Error: `#f85149`

Applied via Tailwind theme extension or direct color values in classes.

## Implementation Order

1. Install dependencies (chart.js, jszip, papaparse, shadcn-svelte components)
2. Create `$lib/types/dashboard.ts`
3. Create `$lib/utils/parsing.ts` + `$lib/utils/bookmarklet.ts`
4. Create `$lib/components/` — Header, TokenPanel, FetchPanel, DropZone, SummaryCards, ChartSection, KeyTable
5. Rewrite `+page.svelte` as orchestrator
6. Update `+layout.svelte` with dark theme
7. Configure Vite proxy for `/api` → `http://localhost:8765`
8. Type-check, lint, build
9. Test with `bun dev` + `python server.py`

## What Stays Unchanged

- `server.py` — zero changes
- API contract (`/api/fetch`, `/api/set-token`, `/api/get-token`)
- CSV parsing logic (ported to TypeScript, same logic)
- Chart.js chart types and options

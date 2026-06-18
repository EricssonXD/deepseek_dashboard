# Suggested Commands

## Development

```bash
bun dev              # Start Vite dev server (frontend only)
python server.py     # Start API proxy on port 8765 (run separately)
```

## Build & Check

```bash
bun run build        # Production build (vite build)
bun run preview      # Preview production build
bun run check        # Type-check via svelte-check
bun run lint         # ESLint + prettier check
bun run format       # Prettier write
```

## Both servers needed

Frontend dev server proxies `/api/*` to Python server.
Configure Vite proxy or run both:

```bash
python server.py 8765 &    # API proxy on 8765
bun dev                     # Vite on 5173 with /api proxy
```

See: `mem:core`

# Conventions

## Code style

- TypeScript strict mode — all types explicit where not inferable
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props` — no legacy `let` reactivity
- Components use `<script lang="ts">`
- Tailwind utility classes for styling — no separate CSS files except `layout.css` for plugins
- Prettier with `prettier-plugin-svelte` + `prettier-plugin-tailwindcss`

## Naming

- Svelte components: PascalCase (e.g., `SummaryCards.svelte`)
- TypeScript files: kebab-case or camelCase depending on convention
- Routes: SvelteKit file-based routing (`+page.svelte`, `+layout.svelte`)

## Architecture

- `$lib/components/` — reusable UI components
- `$lib/utils/` — parsing logic, data transformation
- `$lib/types/` — TypeScript type definitions
- API calls use SvelteKit fetch (or native fetch for client-side)

See: `mem:core`, `mem:tech_stack`

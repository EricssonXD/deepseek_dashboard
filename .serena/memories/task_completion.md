# Task Completion Checklist

After any code change:

1. `bun run check` — must pass (type checking)
2. `bun run lint` — must pass (ESLint + prettier)
3. `bun run build` — must succeed (production build)

All three must pass before considering work done.

See: `mem:conventions`, `mem:suggested_commands`

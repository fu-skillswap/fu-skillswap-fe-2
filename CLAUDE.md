# CLAUDE.md

SkillSwap frontend — a mentor/mentee skill-exchange platform for university students.

## Stack

- Next.js 15 (App Router) + React 19, TypeScript `strict`
- Tailwind CSS v4 (via `@tailwindcss/postcss`) + plain CSS / CSS Modules
- TanStack React Query (server state), React Context (auth), axios (`src/models/apiClient.ts`)
- react-hook-form + yup, lucide-react icons, react-hot-toast, Radix Select, AOS (landing)
- Deployed to Cloudflare Workers via OpenNext (`wrangler.jsonc`, `open-next.config.ts`)
- Locale-prefixed routes (`/vi`, `/en`) handled by `src/middleware.ts`

## Folder layout

- `src/app/[locale]/...` — routes only. A `page.tsx` fetches data and renders a View.
  Route groups: `(auth)`, `(mentee)`, `mentor/(portal)`, `admin`, `(admin-auth)`, `sysadmin`, `onboarding`.
- `src/views/<area>/<screen>/` — screen-level UI (`XxxView.tsx`) + logic hook (`useXxx.ts`),
  optional `XxxView.module.css`, `*.constants.ts`, and local `components/`.
- `src/components/ui/` — generic reusable primitives.
- `src/components/domain/<feature>/` — feature components (landing, booking-flow, post-card,
  mentee-shell, mentor-shell, admin, ai-chat, notifications, …).
- `src/components/auth/` — `AuthGuard`, `AdminGuard`.
- `src/repositories/` — data access (one repo per domain, uses `apiClient`).
- `src/models/` — types/entities; `src/models/schemas/` — yup schemas.
- `src/providers/` — `AuthProvider`, `QueryProvider`. `src/lib/auth/` — Google OAuth + PKCE.
- `src/data/` — demo/mock data. `src/constants/` — static constants. `src/utils/toast.ts` — toast helper.

## Styling & tokens

- Design tokens live in `src/styles/globals.css`: raw values on `:root` (`--primary`, `--text-main`,
  `--surface`, `--success`, `--ui-radius-*`, shadows…) mapped into Tailwind via `@theme`
  (`bg-primary`, `text-text-main`, `border-border-color`, `bg-surface-subtle`, `rounded-md`, `shadow-blue`…).
- Admin portal styles: `src/styles/admin.css`. Screen-specific styles: colocated `*.module.css`.
- Use token-based classes; do not hardcode new hex colors when a token exists.

## Reusable UI components (`src/components/ui/`)

`Button` (variants primary/secondary/outline/ghost/destructive, sizes sm/md/lg, `loading`, icons),
`IconButton`, `Badge`, `BookingStatusBadge`, `Modal`, `Tabs`, `ToggleGroup`, `TextField`, `TextArea`,
`SelectField`, `FormField`, `Checkbox`, `RadioGroup`, `SelectableRow`, `SkillSwapToast`, `ToastProvider`.

## Commands

```bash
npm run dev           # local dev server
npm run lint          # next lint (NOTE: ESLint is not installed/configured yet — report if it fails/prompts)
npm run typecheck     # tsc --noEmit
npm run format:check  # prettier --check .
npm run build         # next build
# Tests: no test runner/script exists yet — state this explicitly instead of claiming tests passed.
```

CI (`.github/workflows/deploy-cloudflare.yml`) runs `typecheck` then `deploy` on push to `main`.

## Rules

- UI copy (labels, messages, toasts) in **Vietnamese**; code, identifiers, comments and commit
  messages in **English**.
- Login is **Gmail (Google) only** — no email/password, no 2FA, no sign-up form.
- Do **not** change backend contracts, DB, auth flow, build/deploy configs (`next.config.ts`,
  `open-next.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `postcss.config.mjs`, CI) or package versions.
- Never edit `wrangler.jsonc`, `open-next.config.*`, `next.config.*` or `.env*` files without the
  user's explicit permission.
- If an API is missing, keep data in local state and leave `// TODO(api): <what endpoint is needed>`.
- Reuse existing components and tokens first; do not add a dependency when an equivalent exists.
- Follow Prettier config (single quotes, semicolons, trailing commas, width 100).
- Before saying a task is done, run lint, typecheck, tests and build; report each result honestly
  (including "not configured" or failures with output).

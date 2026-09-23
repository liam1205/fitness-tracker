# Frontend

React + TypeScript on Vite, with TanStack Router for routing, TanStack Query for
server state, Tailwind + shadcn/ui for the UI layer, and Oxlint for linting.

## Setup

```bash
cd Frontend
pnpm install
cp .env.example .env    # set VITE_API_URL if the backend isn't on :8000
pnpm dev                # http://localhost:5173
```

Other scripts: `pnpm build` (typecheck + bundle), `pnpm preview`, `pnpm lint`.

## Layout

```
src/
├── main.tsx           # Entry: query client, router, global providers
├── routes/            # File-based routes (TanStack Router)
│   ├── __root.tsx     # Root layout, 404 and error boundaries
│   ├── login.tsx      # Public sign-in / sign-up
│   └── _authenticated # Everything behind the auth guard
├── api/               # Generated client (see below) + axios instance
├── components/
│   ├── ui/            # shadcn/ui primitives
│   └── views/         # App components (sidebar, page layout, auth view)
└── lib/               # auth store, error helpers, `cn`
```

Routes are discovered from `src/routes/` and `routeTree.gen.ts` is regenerated
automatically by the Vite plugin — don't edit it by hand.

## Auth

The session lives in an HttpOnly cookie set by the backend, so JavaScript never
holds a token. `src/lib/auth.ts` mirrors "who is signed in" for the router
guards; `main.tsx` calls `auth.bootstrap()` before the first render so a hard
refresh restores the session. Routes under `_authenticated/` are gated by
`_authenticated.tsx`, which redirects to `/login` with a `?redirect=` target.

## API client (orval)

The typed API client and TanStack Query hooks are generated from the backend's
OpenAPI schema with [orval](https://orval.dev).

- **Config:** `orval.config.ts`
- **Input:** `../Backend/openapi.json` (regenerate it in the backend with
  `python -m scripts.export_openapi`, or point orval at
  `http://localhost:8000/openapi.json` while the server runs)
- **Output:** `src/api/` — `endpoints/` (hooks) and `model/` (types); `clean: true`
  wipes this folder on each run, so don't hand-edit it
- **HTTP layer:** `src/api/http-client.ts` — a shared axios instance
  (base URL from `VITE_API_URL`, `withCredentials` for the session cookie)

Regenerate after the backend API changes:

```bash
pnpm generate:api
```

### Usage

`QueryClientProvider` is already set up in `src/main.tsx`, so hooks work anywhere:

```tsx
import { useListUsers, useCreateUser } from '@/api/endpoints/users/users'

function Users() {
  const { data: users, isLoading } = useListUsers()
  const createUser = useCreateUser()

  // createUser.mutate({ data: { email, password } })
}
```

Query and mutation failures are surfaced as toasts globally (see `main.tsx`), so
you only need local error handling when you want something bespoke.

## Adding UI components

Only the primitives this template actually uses live in `src/components/ui/`.
Pull in more as you need them:

```bash
pnpm dlx shadcn@latest add dialog table badge
```

## Linting

For a production app, enable type-aware rules by installing `oxlint-tsgolint`
and adding `"options": { "typeAware": true }` to `.oxlintrc.json`. See the
[Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules).

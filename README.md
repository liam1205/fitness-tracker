# web-app-template

A starting point for a full-stack web app: a **FastAPI** backend and a **React**
frontend, with cookie-based authentication already wired end to end and a typed
API client generated from the backend's OpenAPI schema.

Download it, rename it, and start building.

## Stack

| Layer    | Choices                                                                    |
| -------- | -------------------------------------------------------------------------- |
| Backend  | FastAPI, SQLAlchemy 2.0 (async), Alembic, PostgreSQL, pydantic-settings, Hatch |
| Frontend | React 19, Vite, TypeScript, TanStack Router + Query, Tailwind, shadcn/ui    |
| Between  | orval — generates typed hooks and models from `Backend/openapi.json`        |

## Quick start

Two terminals. **Backend:**

```bash
cd Backend
pipx install hatch            # once, globally
cp .env.example .env
hatch run db                  # PostgreSQL 17 on :5432
hatch run migrate
hatch run dev
```

**Frontend:**

```bash
cd Frontend
pnpm install
cp .env.example .env
pnpm dev
```

Open http://localhost:5173, create an account, and you're in. Swagger UI lives at
http://localhost:8000/docs.

## Deploying

`render.yaml` is a [Render](https://render.com) Blueprint covering the API and
its PostgreSQL database: push the repo, then **New → Blueprint** in Render. It
provisions both, wires up `DATABASE_URL`, generates `SECRET_KEY`, and sets the
production cookie flags. The one thing you supply is `BACKEND_CORS_ORIGINS` —
your frontend's origin. Details and free-tier caveats in
[Backend/README.md](Backend/README.md#deploying-to-render).

Deploying elsewhere? Set `ENVIRONMENT=production`, a random `SECRET_KEY`,
`SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_SAMESITE=none`, and
`BACKEND_CORS_ORIGINS`, then serve with
`uvicorn app.main:app --host 0.0.0.0 --port $PORT` after `alembic upgrade head`.

## How it fits together

```
web-app-template/
├── Backend/     # FastAPI app, migrations, OpenAPI export  → Backend/README.md
├── Frontend/    # Vite app, routes, generated API client   → Frontend/README.md
└── render.yaml  # Render Blueprint: API service + database
```

**Authentication.** Sign-in returns an HttpOnly cookie holding a Fernet-encrypted
session token — JavaScript can never read it. The window slides forward on every
authenticated request (30 minutes of inactivity by default). On the frontend,
`src/lib/auth.ts` mirrors who is signed in for the router guards; everything
under `src/routes/_authenticated/` is gated.

**The API contract.** The backend is the source of truth. After changing an
endpoint or schema, re-export and regenerate:

```bash
cd Backend && hatch run openapi     # writes Backend/openapi.json
cd ../Frontend && pnpm generate:api # rewrites Frontend/src/api/
```

Never hand-edit `Frontend/src/api/` — orval wipes it on every run.

## Adding to it

- **An endpoint** — new module in `Backend/app/api/routes/` exposing an
  `APIRouter`, included in `app/api/router.py`. Add `user: CurrentUser` to the
  signature to require authentication.
- **A table** — a model in `Backend/app/models/`, exported from that package's
  `__init__.py`, then `alembic revision --autogenerate -m "..."`.
- **A page** — a file in `Frontend/src/routes/_authenticated/`; the route tree
  regenerates itself. Add a link to `NAV_ITEMS` in `AppSideBar.tsx`.
- **A UI component** — `pnpm dlx shadcn@latest add <name>` in `Frontend/`.

Each half has its own README with the details.

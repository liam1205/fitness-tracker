# Backend

FastAPI backend for the web app template.

## Setup

Environments and tasks are managed with [Hatch](https://hatch.pypa.io). Install
it once, globally:

```bash
pipx install hatch          # or: pip install --user hatch
```

Then, from `Backend/`:

```bash
cp .env.example .env        # optional; sensible defaults are built in
hatch env create            # builds .venv from pyproject.toml
```

Dependencies live in `pyproject.toml`, not a `requirements.txt`. Hatch creates
the environment at `Backend/.venv` so editors pick it up automatically.

## Tasks

Every task runs through Hatch — no `activate` step, and the environment is
synced with `pyproject.toml` before each run:

| Command                             | Does                                       |
| ----------------------------------- | ------------------------------------------ |
| `hatch run dev`                     | Dev server on :8000 with reload            |
| `hatch run dev 9000`                | ... on a different port                    |
| `hatch run start`                   | Production-style server (binds `$PORT`)    |
| `hatch run db`                      | Start local PostgreSQL (docker compose)    |
| `hatch run migrate`                 | `alembic upgrade head`                     |
| `hatch run revision "add widgets"`  | Autogenerate a migration                   |
| `hatch run rollback`                | Roll back one migration                    |
| `hatch run openapi`                 | Re-export `openapi.json`                   |
| `hatch shell`                       | Drop into the environment                  |

Anything not wrapped as a script still works with `hatch run <cmd>`, e.g.
`hatch run python -c "..."` or `hatch run alembic history`.

## Database (PostgreSQL)

The backend talks to PostgreSQL via async SQLAlchemy 2.0 (`asyncpg` driver),
with Alembic for migrations.

Start a local Postgres (matches the default `DATABASE_URL`) and migrate:

```bash
hatch run db          # postgres 17 on localhost:5432, db "app"
hatch run migrate
```

Configure the connection with `DATABASE_URL` in `.env`. A
`postgresql+asyncpg://user:pass@host:port/dbname` URL is used as-is; a managed
provider's `postgresql://` or `postgres://` string (with `?sslmode=…`) is
rewritten to the asyncpg form automatically.

### Migrations

```bash
hatch run revision "describe change"   # create a migration
hatch run migrate                      # apply
hatch run rollback                     # roll back one
```

Models live in `app/models/` and are imported in `app/models/__init__.py` so
Alembic autogenerate can see them.

## Run

```bash
hatch run dev
```

- API base: `http://localhost:8000/api/v1`
- Health check: `http://localhost:8000/api/v1/health`

## OpenAPI & Swagger

The OpenAPI schema and interactive docs are provided out of the box by FastAPI:

| What            | URL                              |
| --------------- | -------------------------------- |
| OpenAPI JSON    | `http://localhost:8000/openapi.json` |
| Swagger UI      | `http://localhost:8000/docs`     |
| ReDoc           | `http://localhost:8000/redoc`    |

Use **Swagger UI** (`/docs`) to try the endpoints interactively.

### Exporting the schema for orval

The frontend can generate a typed client from a static schema file (no running
server required):

```bash
cd Backend
hatch run openapi   # writes Backend/openapi.json
```

`operationId`s are set to the endpoint function names (e.g. `listUsers`,
`getUser`, `createUser`) so the generated client has clean, predictable names.

Point orval at either the live endpoint (`http://localhost:8000/openapi.json`)
or the exported `Backend/openapi.json`.

## Deploying to Render

`render.yaml` in the repo root is a [Blueprint](https://render.com/docs/blueprint-spec)
describing the API service and its PostgreSQL database. Push the repo to
GitHub/GitLab, then in Render choose **New → Blueprint** and pick it. Render
creates both, wires `DATABASE_URL` between them, and generates `SECRET_KEY`.

The only value it asks you for is `BACKEND_CORS_ORIGINS` — the frontend
origin(s) allowed to call the API. A single origin
(`https://your-frontend.onrender.com`), a comma-separated list, or a JSON array
are all accepted. Credentialed CORS forbids `*`, so these must be exact origins.
You won't know the frontend's URL on the very first deploy; put a placeholder in
and edit it afterwards.

What runs on each deploy:

```bash
pip install .                                                # build
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT   # start
```

Render does not need Hatch — `pip install .` reads the same dependency list
from `pyproject.toml`, so local and deployed environments cannot drift. The
start command mirrors `hatch run start`.

Binding `0.0.0.0` and Render's `$PORT` is required — a service that only
listens on localhost is treated as failed.

### Settings that differ in production

| Variable                 | Production value | Why                                                     |
| ------------------------ | ---------------- | ------------------------------------------------------- |
| `ENVIRONMENT`            | `production`     | Reported by `/health`; also enables the SECRET_KEY guard |
| `SECRET_KEY`             | generated        | Any random string; see below                            |
| `SESSION_COOKIE_SECURE`  | `true`           | Cross-site cookies are HTTPS-only                        |
| `SESSION_COOKIE_SAMESITE`| `none`           | Frontend and API are on different origins                |
| `BACKEND_CORS_ORIGINS`   | your frontend    | Exact origins, JSON array                                |

`SECRET_KEY` no longer has to be a Fernet key. Any sufficiently random string
works — it is hashed into one — which is what lets Render generate it for you.
As a safety net, the app refuses to start when `ENVIRONMENT` is anything other
than `development` and `SECRET_KEY` is still the placeholder from `.env.example`.
Changing `SECRET_KEY` signs everyone out.

`DATABASE_URL` is normalized on load: Render hands out `postgresql://…`
(and `?sslmode=require` on external URLs), which is rewritten to the
`postgresql+asyncpg://…?ssl=require` form the async driver needs. You can paste
a provider's connection string verbatim.

Python version comes from `.python-version`.

### Free-tier caveats

Free instances sleep after ~15 minutes idle, so the next request pays a ~30s
cold start. Free Postgres databases are **deleted after 30 days** — move to a
paid database plan before storing anything you care about.

On a paid plan, move `alembic upgrade head` out of `startCommand` into
`preDeployCommand` so migrations run once per deploy instead of once per
instance.

## Project layout

```
Backend/
├── app/
│   ├── main.py            # FastAPI app, CORS, OpenAPI/Swagger config
│   ├── db.py              # Declarative Base, async engine, get_db dependency
│   ├── core/
│   │   ├── config.py      # Settings (pydantic-settings)
│   │   ├── security.py    # Password hashing
│   │   └── session.py     # Encrypted session cookie
│   ├── models/           # SQLAlchemy ORM models
│   ├── crud/             # Data-access helpers
│   ├── api/
│   │   ├── deps.py        # Shared dependencies (current user)
│   │   ├── router.py      # Aggregates all routes
│   │   └── routes/        # Route modules (health, auth, users, ...)
│   └── schemas/           # Pydantic request/response models
├── alembic/              # Migration environment + versions/
├── alembic.ini
├── docker-compose.yml    # Local PostgreSQL
├── scripts/export_openapi.py
└── pyproject.toml        # Dependencies, Hatch environment + task scripts
```

Add new endpoints by creating a module in `app/api/routes/`, exposing an
`APIRouter`, and including it in `app/api/router.py`.

# Dev image: installs dependencies once at build time; source code is bind-mounted
# by docker-compose.yml so edits are picked up without rebuilding.
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml ./
COPY app ./app

# Editable install so the package resolves to /app (the bind mount) instead of
# a copy in site-packages — required for uvicorn --reload to see file changes.
RUN pip install --no-cache-dir -e .

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"]

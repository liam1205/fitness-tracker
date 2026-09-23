import json
from typing import Annotated
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

PLACEHOLDER_SECRET_KEY = "changeme-generate-a-real-fernet-key"

# libpq spells the TLS option `sslmode`; asyncpg calls it `ssl` and accepts the
# same values. Managed providers hand out libpq-style URLs, so translate.
_LIBPQ_SSL_PARAM = "sslmode"
_ASYNCPG_SSL_PARAM = "ssl"


class Settings(BaseSettings):
    """Application settings, loaded from environment variables / a .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    PROJECT_NAME: str = "Web App Template API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "Backend API for the web app template."
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"

    # Auth / session — the session cookie holds a Fernet-encrypted token.
    # SECRET_KEY must be a url-safe base64-encoded 32-byte Fernet key. Generate one with:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    SECRET_KEY: str = "changeme-generate-a-real-fernet-key"
    SESSION_COOKIE_NAME: str = "session"
    # Sliding session lifetime: the cookie is re-issued on every authenticated
    # request, so this is the maximum window of inactivity before expiry.
    SESSION_MAX_AGE_SECONDS: int = 1800  # 30 minutes
    SESSION_COOKIE_SECURE: bool = False  # set True in production (HTTPS only)
    SESSION_COOKIE_SAMESITE: str = "lax"

    # Database — async SQLAlchemy URL (postgresql+asyncpg://user:pass@host:port/db).
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"
    DB_ECHO: bool = False

    # CORS — origins allowed to call the API (e.g. the Vite dev server).
    # NoDecode hands the raw environment string to the validator below instead
    # of demanding JSON, so a single origin pasted into a hosting dashboard
    # doesn't crash the app on boot.
    BACKEND_CORS_ORIGINS: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value: object) -> object:
        """Accept a JSON array, a comma-separated list, or a single origin."""
        if not isinstance(value, str):
            return value
        text = value.strip()
        if text.startswith("["):
            return json.loads(text)
        return [origin.strip() for origin in text.split(",") if origin.strip()]

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url(cls, url: str) -> str:
        """Rewrite a managed provider's connection string for asyncpg.

        Render, Heroku and friends inject a libpq-style URL — ``postgres://`` or
        ``postgresql://``, sometimes with ``?sslmode=require``. Accepting those
        verbatim means the app only ever fails at the first query, so normalize
        them here instead of asking every deployment to hand-edit the URL.
        """
        parts = urlsplit(url)
        scheme = parts.scheme
        if scheme in ("postgres", "postgresql"):
            scheme = "postgresql+asyncpg"
        elif scheme != "postgresql+asyncpg":
            # Not a Postgres URL we recognise — leave it for the engine to reject.
            return url

        query = [
            (_ASYNCPG_SSL_PARAM if key == _LIBPQ_SSL_PARAM else key, value)
            for key, value in parse_qsl(parts.query, keep_blank_values=True)
        ]
        return urlunsplit(
            (scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
        )

    @model_validator(mode="after")
    def _reject_placeholder_secret_key(self) -> "Settings":
        """Refuse to start outside development with the shipped placeholder key.

        SECRET_KEY is hashed into a Fernet key (see ``app.core.session``), so a
        bad value no longer crashes on first use — it would just encrypt every
        session with a secret that is public knowledge.
        """
        if self.ENVIRONMENT != "development" and self.SECRET_KEY == PLACEHOLDER_SECRET_KEY:
            raise ValueError(
                f"SECRET_KEY is still the placeholder while ENVIRONMENT={self.ENVIRONMENT!r}. "
                "Set it to a random secret."
            )
        return self


# Built once at import time and shared everywhere via `from app.core.config import settings`.
settings = Settings()

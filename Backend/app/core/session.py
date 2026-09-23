"""Session cookie handling.

The browser never sees anything but an opaque, Fernet-encrypted token stored in
an HttpOnly cookie — page JavaScript cannot read it (XSS-safe) and only the
backend can decrypt it. Fernet embeds a creation timestamp, so ``decrypt`` with a
``ttl`` enforces the sliding 30-minute session window (see ``get_current_user``,
which re-issues the cookie on every authenticated request).
"""

import base64
import hashlib
import json
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken
from fastapi import Response

from app.core.config import settings


@lru_cache
def _fernet() -> Fernet:
    """Return a cached Fernet built from the configured SECRET_KEY.

    Fernet wants a url-safe base64 32-byte key. A SECRET_KEY already in that
    shape is used as-is; anything else is hashed into one, so a plain random
    string — what a host's "generate a secret for me" button produces — works
    just as well. Changing SECRET_KEY invalidates every existing session.
    """
    secret = settings.SECRET_KEY.encode()
    try:
        return Fernet(secret)
    except (ValueError, TypeError):
        return Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret).digest()))


def create_session_token(user_id: int) -> str:
    """Encrypt a session token carrying the user id."""
    payload = json.dumps({"sub": user_id}).encode()
    return _fernet().encrypt(payload).decode()


def read_session_token(token: str) -> int | None:
    """Decrypt a session token, returning the user id, or None if invalid/expired."""
    try:
        payload = _fernet().decrypt(
            token.encode(), ttl=settings.SESSION_MAX_AGE_SECONDS
        )
    except InvalidToken:
        return None
    try:
        return int(json.loads(payload)["sub"])
    except (ValueError, KeyError, TypeError):
        return None


def set_session_cookie(response: Response, user_id: int) -> None:
    """Set (or refresh) the encrypted session cookie on the response."""
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=create_session_token(user_id),
        max_age=settings.SESSION_MAX_AGE_SECONDS,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    """Remove the session cookie (logout). Attributes must match set_session_cookie."""
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        path="/",
    )

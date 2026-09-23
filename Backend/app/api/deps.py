"""Shared FastAPI dependencies for authentication."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.core.config import settings
from app.core.session import read_session_token, set_session_cookie
from app.db import get_db
from app.models.user import User

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated.",
)


async def get_current_user(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Resolve the current user from the encrypted session cookie.

    Refreshes the cookie on every call so the 30-minute window slides forward
    with each authenticated request. Raises 401 if the cookie is missing,
    tampered, expired, or the user is gone/inactive.
    """
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not token:
        raise _UNAUTHENTICATED

    user_id = read_session_token(token)
    if user_id is None:
        raise _UNAUTHENTICATED

    user = await crud.user.get_user(db, user_id)
    if user is None or not user.is_active:
        raise _UNAUTHENTICATED

    # Sliding session: re-issue a fresh token on each authenticated request.
    set_session_cookie(response, user.id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

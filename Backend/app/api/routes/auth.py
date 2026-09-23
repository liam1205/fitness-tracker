from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.core.session import clear_session_cookie, set_session_cookie
from app.db import get_db
from app.schemas.user import UserCreate, UserLogin, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="Register and sign in",
)
async def register(
    payload: UserCreate,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Create a new account and start a session (sets the encrypted cookie)."""
    if await crud.user.get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    user = await crud.user.create_user(db, payload)
    set_session_cookie(response, user.id)
    return user


@router.post("/login", response_model=UserRead, summary="Sign in")
async def login(
    payload: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> UserRead:
    """Verify credentials and start a session (sets the encrypted cookie)."""
    user = await crud.user.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )
    set_session_cookie(response, user.id)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Sign out")
async def logout(response: Response) -> None:
    """End the current session by clearing the cookie."""
    clear_session_cookie(response)


@router.get("/me", response_model=UserRead, summary="Get the current user")
async def read_current_user(user: CurrentUser) -> UserRead:
    """Return the signed-in user and refresh the session window."""
    return user

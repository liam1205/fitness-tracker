from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.db import get_db
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead], summary="List users")
async def list_users(db: AsyncSession = Depends(get_db)) -> list[UserRead]:
    """Return all users."""
    return await crud.user.list_users(db)


@router.get("/{user_id}", response_model=UserRead, summary="Get a user")
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)) -> UserRead:
    """Return a single user by id."""
    user = await crud.user.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Create a user")
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserRead:
    """Register a new user. The password is hashed before storage."""
    if await crud.user.get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )
    return await crud.user.create_user(db, payload)

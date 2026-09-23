from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.user_settings import UserSettingsRead, UserSettingsUpdate

router = APIRouter(prefix="/user-settings", tags=["user-settings"])


@router.get("", response_model=UserSettingsRead, summary="Get the current user's settings")
async def get_user_settings(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserSettingsRead:
    """Return the current user's settings, seeding defaults if none exist yet."""
    settings = await crud.user_settings.get_user_settings(db, user.id)
    if settings is None:
        settings = await crud.user_settings.create_default_settings_for_user(db, user.id)
    return settings


@router.patch("", response_model=UserSettingsRead, summary="Update the current user's settings")
async def update_user_settings(
    payload: UserSettingsUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> UserSettingsRead:
    """Update the current user's settings. Omitted fields are left unchanged."""
    return await crud.user_settings.update_user_settings(db, user.id, payload)

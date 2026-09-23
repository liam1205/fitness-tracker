from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import Language, Theme
from app.models.user_settings import UserSettings
from app.schemas.user_settings import UserSettingsUpdate


async def get_user_settings(db: AsyncSession, user_id: int) -> UserSettings | None:
    return await db.get(UserSettings, user_id)


async def create_default_settings_for_user(db: AsyncSession, user_id: int) -> UserSettings:
    """Seed a user's settings with the app defaults."""
    settings = UserSettings(user_id=user_id, language=Language.ENGLISH, theme=Theme.SYSTEM)
    db.add(settings)
    await db.flush()
    return settings


async def update_user_settings(
    db: AsyncSession, user_id: int, payload: UserSettingsUpdate
) -> UserSettings:
    settings = await get_user_settings(db, user_id)
    if settings is None:
        settings = await create_default_settings_for_user(db, user_id)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)

    await db.flush()
    await db.refresh(settings)
    return settings

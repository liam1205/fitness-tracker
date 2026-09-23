from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.default_exercises import DEFAULT_EXERCISES
from app.models.exercise import Exercise


async def list_exercises_for_user(
    db: AsyncSession, user_id: int, page: int, page_size: int
) -> tuple[list[Exercise], int]:
    """Return a page of the exercises owned by ``user_id``, plus the total count."""
    total = await db.scalar(
        select(func.count()).select_from(Exercise).where(Exercise.created_by == user_id)
    )
    result = await db.execute(
        select(Exercise)
        .where(Exercise.created_by == user_id)
        .order_by(Exercise.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total or 0


async def create_default_exercises_for_user(db: AsyncSession, user_id: int) -> list[Exercise]:
    """Seed a user's exercise list from the built-in default catalog.

    Each default becomes a row owned by the user (``created_by``), so it
    behaves like any other exercise they could have created themselves.
    """
    exercises = [
        Exercise(created_by=user_id, name=name, muscle_group=muscle_group)
        for name, muscle_group in DEFAULT_EXERCISES
    ]
    db.add_all(exercises)
    await db.flush()
    return exercises

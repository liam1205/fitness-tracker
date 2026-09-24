from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.default_exercises import DEFAULT_EXERCISES
from app.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate


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


async def get_exercise_for_user(db: AsyncSession, user_id: int, exercise_id: int) -> Exercise | None:
    """Return the exercise if it exists and is owned by ``user_id``, else ``None``."""
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id, Exercise.created_by == user_id)
    )
    return result.scalar_one_or_none()


async def create_exercise_for_user(
    db: AsyncSession, user_id: int, payload: ExerciseCreate
) -> Exercise:
    """Create a new exercise owned by ``user_id``."""
    exercise = Exercise(
        created_by=user_id, name=payload.name, muscle_group=payload.muscle_group
    )
    db.add(exercise)
    await db.flush()
    await db.refresh(exercise)
    return exercise


async def update_exercise_for_user(
    db: AsyncSession, user_id: int, exercise_id: int, payload: ExerciseUpdate
) -> Exercise | None:
    """Update an exercise owned by ``user_id``. Returns ``None`` if not found."""
    exercise = await get_exercise_for_user(db, user_id, exercise_id)
    if exercise is None:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exercise, field, value)

    await db.flush()
    await db.refresh(exercise)
    return exercise


async def delete_exercise_for_user(db: AsyncSession, user_id: int, exercise_id: int) -> bool:
    """Delete an exercise owned by ``user_id``. Returns whether it was found."""
    exercise = await get_exercise_for_user(db, user_id, exercise_id)
    if exercise is None:
        return False

    await db.delete(exercise)
    await db.flush()
    return True


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

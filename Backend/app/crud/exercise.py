import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.default_exercises import DEFAULT_EXERCISES
from app.models.exercise import Exercise, ExerciseMuscleGroup
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate, MuscleGroupFactor


def _muscle_group_rows(
    primary: MuscleGroupFactor, secondaries: list[MuscleGroupFactor]
) -> list[ExerciseMuscleGroup]:
    # Go through str so e.g. 0.3 is stored as 0.30, not 0.2999…
    return [
        ExerciseMuscleGroup(
            muscle_group=primary.muscle_group, factor=Decimal(str(primary.factor)), is_primary=True
        ),
        *(
            ExerciseMuscleGroup(muscle_group=s.muscle_group, factor=Decimal(str(s.factor)))
            for s in secondaries
        ),
    ]


async def list_exercises_for_user(
    db: AsyncSession, user_id: uuid.UUID, page: int, page_size: int
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


async def get_exercise_for_user(
    db: AsyncSession, user_id: uuid.UUID, exercise_id: uuid.UUID
) -> Exercise | None:
    """Return the exercise if it exists and is owned by ``user_id``, else ``None``."""
    result = await db.execute(
        select(Exercise).where(Exercise.id == exercise_id, Exercise.created_by == user_id)
    )
    return result.scalar_one_or_none()


async def create_exercise_for_user(
    db: AsyncSession, user_id: uuid.UUID, payload: ExerciseCreate
) -> Exercise:
    """Create a new exercise owned by ``user_id``."""
    exercise = Exercise(
        created_by=user_id,
        name=payload.name,
        muscle_groups=_muscle_group_rows(
            payload.primary_muscle_group, payload.secondary_muscle_groups
        ),
    )
    db.add(exercise)
    await db.flush()
    await db.refresh(exercise)
    return exercise


async def update_exercise_for_user(
    db: AsyncSession, user_id: uuid.UUID, exercise_id: uuid.UUID, payload: ExerciseUpdate
) -> Exercise | None:
    """Update an exercise owned by ``user_id``. Returns ``None`` if not found."""
    exercise = await get_exercise_for_user(db, user_id, exercise_id)
    if exercise is None:
        return None

    if payload.name is not None:
        exercise.name = payload.name

    if payload.primary_muscle_group is not None and payload.secondary_muscle_groups is not None:
        # Delete the old rows before inserting the new ones, so a muscle group
        # that is kept, or moves between primary and secondary, never clashes
        # with its old row on the primary key or the one-primary index.
        exercise.muscle_groups.clear()
        await db.flush()
        exercise.muscle_groups.extend(
            _muscle_group_rows(payload.primary_muscle_group, payload.secondary_muscle_groups)
        )

    await db.flush()
    await db.refresh(exercise)
    return exercise


async def delete_exercise_for_user(db: AsyncSession, user_id: uuid.UUID, exercise_id: uuid.UUID) -> bool:
    """Delete an exercise owned by ``user_id``. Returns whether it was found."""
    exercise = await get_exercise_for_user(db, user_id, exercise_id)
    if exercise is None:
        return False

    await db.delete(exercise)
    await db.flush()
    return True


async def create_default_exercises_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Exercise]:
    """Seed a user's exercise list from the built-in default catalog.

    Each default becomes a row owned by the user (``created_by``), so it
    behaves like any other exercise they could have created themselves.
    """
    exercises = [
        Exercise(
            created_by=user_id,
            name=name,
            muscle_groups=_muscle_group_rows(
                MuscleGroupFactor(muscle_group=primary, factor=1),
                [
                    MuscleGroupFactor(muscle_group=group, factor=factor)
                    for group, factor in secondaries.items()
                ],
            ),
        )
        for name, primary, secondaries in DEFAULT_EXERCISES
    ]
    db.add_all(exercises)
    await db.flush()
    return exercises

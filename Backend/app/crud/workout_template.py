from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.workout_template import TemplateExercise, WorkoutTemplate
from app.schemas.workout_template import (
    TemplateExerciseRead,
    WorkoutTemplateCreate,
    WorkoutTemplateRead,
    WorkoutTemplateUpdate,
)


async def _get_template_for_user(
    db: AsyncSession, user_id: int, template_id: int
) -> WorkoutTemplate | None:
    result = await db.execute(
        select(WorkoutTemplate).where(
            WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def _get_exercises_for_template(
    db: AsyncSession, template_id: int
) -> list[TemplateExerciseRead]:
    rows = await db.execute(
        select(TemplateExercise, Exercise)
        .join(Exercise, Exercise.id == TemplateExercise.exercise_id)
        .where(TemplateExercise.template_id == template_id)
        .order_by(TemplateExercise.position)
    )
    return [
        TemplateExerciseRead(
            id=template_exercise.id,
            exercise_id=template_exercise.exercise_id,
            name=exercise.name,
            muscle_group=exercise.muscle_group,
            position=template_exercise.position,
            set_count=template_exercise.set_count,
        )
        for template_exercise, exercise in rows.all()
    ]


async def list_workout_templates_for_user(
    db: AsyncSession, user_id: int
) -> list[WorkoutTemplateRead]:
    """Return all workout templates owned by ``user_id``, with their exercise slots.

    ``WorkoutTemplate`` has no ORM relationship to its exercises, so slots are
    fetched separately and grouped by template id rather than eager-loaded.
    """
    templates = (
        (
            await db.execute(
                select(WorkoutTemplate)
                .where(WorkoutTemplate.user_id == user_id)
                .order_by(WorkoutTemplate.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    exercises_by_template: dict[int, list[TemplateExerciseRead]] = defaultdict(list)
    if templates:
        rows = await db.execute(
            select(TemplateExercise, Exercise)
            .join(Exercise, Exercise.id == TemplateExercise.exercise_id)
            .where(TemplateExercise.template_id.in_(t.id for t in templates))
            .order_by(TemplateExercise.position)
        )
        for template_exercise, exercise in rows.all():
            exercises_by_template[template_exercise.template_id].append(
                TemplateExerciseRead(
                    id=template_exercise.id,
                    exercise_id=template_exercise.exercise_id,
                    name=exercise.name,
                    muscle_group=exercise.muscle_group,
                    position=template_exercise.position,
                    set_count=template_exercise.set_count,
                )
            )

    return [
        WorkoutTemplateRead(
            id=template.id,
            user_id=template.user_id,
            name=template.name,
            created_at=template.created_at,
            exercises=exercises_by_template[template.id],
        )
        for template in templates
    ]


async def create_workout_template_for_user(
    db: AsyncSession, user_id: int, payload: WorkoutTemplateCreate
) -> WorkoutTemplateRead:
    """Create a new workout template, with its exercise slots, owned by ``user_id``.

    Slot position is assigned from list order rather than taken from the
    payload, so the client can't create gaps or duplicates.
    """
    template = WorkoutTemplate(user_id=user_id, name=payload.name)
    db.add(template)
    await db.flush()

    exercises: list[TemplateExerciseRead] = []
    for position, exercise_payload in enumerate(payload.exercises, start=1):
        exercise = await db.get(Exercise, exercise_payload.exercise_id)
        template_exercise = TemplateExercise(
            template_id=template.id,
            exercise_id=exercise_payload.exercise_id,
            position=position,
            set_count=exercise_payload.set_count,
        )
        db.add(template_exercise)
        await db.flush()

        exercises.append(
            TemplateExerciseRead(
                id=template_exercise.id,
                exercise_id=template_exercise.exercise_id,
                name=exercise.name,
                muscle_group=exercise.muscle_group,
                position=template_exercise.position,
                set_count=template_exercise.set_count,
            )
        )

    await db.refresh(template)
    return WorkoutTemplateRead(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        created_at=template.created_at,
        exercises=exercises,
    )


async def get_workout_template_for_user(
    db: AsyncSession, user_id: int, template_id: int
) -> WorkoutTemplateRead | None:
    """Return a single workout template owned by ``user_id``, with its exercise slots.

    Returns ``None`` if no such template exists for this user.
    """
    template = await _get_template_for_user(db, user_id, template_id)
    if template is None:
        return None

    exercises = await _get_exercises_for_template(db, template.id)
    return WorkoutTemplateRead(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        created_at=template.created_at,
        exercises=exercises,
    )


async def update_workout_template_for_user(
    db: AsyncSession, user_id: int, template_id: int, payload: WorkoutTemplateUpdate
) -> WorkoutTemplateRead | None:
    """Update a workout template owned by ``user_id``. Returns ``None`` if not found.

    Omitted fields are left unchanged. When ``exercises`` is provided, the
    existing slots are replaced wholesale and position is reassigned from
    list order, matching how ``create_workout_template_for_user`` works.
    """
    template = await _get_template_for_user(db, user_id, template_id)
    if template is None:
        return None

    if payload.name is not None:
        template.name = payload.name

    if payload.exercises is not None:
        await db.execute(
            delete(TemplateExercise).where(TemplateExercise.template_id == template.id)
        )
        for position, exercise_payload in enumerate(payload.exercises, start=1):
            db.add(
                TemplateExercise(
                    template_id=template.id,
                    exercise_id=exercise_payload.exercise_id,
                    position=position,
                    set_count=exercise_payload.set_count,
                )
            )

    await db.flush()
    exercises = await _get_exercises_for_template(db, template.id)
    await db.refresh(template)
    return WorkoutTemplateRead(
        id=template.id,
        user_id=template.user_id,
        name=template.name,
        created_at=template.created_at,
        exercises=exercises,
    )


async def delete_workout_template_for_user(
    db: AsyncSession, user_id: int, template_id: int
) -> bool:
    """Delete a workout template owned by ``user_id``, along with its exercise slots.

    Returns ``False`` if no such template exists for this user.
    """
    template = await _get_template_for_user(db, user_id, template_id)
    if template is None:
        return False

    await db.execute(delete(TemplateExercise).where(TemplateExercise.template_id == template.id))
    await db.delete(template)
    await db.flush()
    return True

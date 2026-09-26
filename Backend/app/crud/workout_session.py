from collections import defaultdict
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.workout_session import SessionExercise, SessionSet, WorkoutSession
from app.models.workout_template import TemplateExercise, WorkoutTemplate
from app.schemas.workout_session import SessionExerciseRead, SessionSetRead, WorkoutSessionRead


async def _get_exercises_for_sessions(
    db: AsyncSession, session_ids: list[int]
) -> dict[int, list[SessionExerciseRead]]:
    exercises_by_session: dict[int, list[SessionExerciseRead]] = defaultdict(list)
    if not session_ids:
        return exercises_by_session

    exercise_rows = (
        await db.execute(
            select(SessionExercise, Exercise)
            .join(Exercise, Exercise.id == SessionExercise.exercise_id)
            .where(SessionExercise.session_id.in_(session_ids))
            .order_by(SessionExercise.position)
        )
    ).all()

    sets_by_session_exercise: dict[int, list[SessionSetRead]] = defaultdict(list)
    session_exercise_ids = [session_exercise.id for session_exercise, _ in exercise_rows]
    if session_exercise_ids:
        set_rows = (
            await db.execute(
                select(SessionSet)
                .where(SessionSet.session_exercise_id.in_(session_exercise_ids))
                .order_by(SessionSet.set_number)
            )
        ).scalars()
        for session_set in set_rows:
            sets_by_session_exercise[session_set.session_exercise_id].append(
                SessionSetRead(
                    id=session_set.id,
                    set_number=session_set.set_number,
                    reps=session_set.reps,
                    weight=session_set.weight,
                    completed=session_set.completed,
                )
            )

    for session_exercise, exercise in exercise_rows:
        exercises_by_session[session_exercise.session_id].append(
            SessionExerciseRead(
                id=session_exercise.id,
                exercise_id=session_exercise.exercise_id,
                name=exercise.name,
                muscle_group=exercise.muscle_group,
                position=session_exercise.position,
                sets=sets_by_session_exercise[session_exercise.id],
            )
        )

    return exercises_by_session


async def _list_workout_sessions_for_user(
    db: AsyncSession, user_id: int, *, completed: bool
) -> list[WorkoutSessionRead]:
    condition = (
        WorkoutSession.completed_at.is_not(None)
        if completed
        else WorkoutSession.completed_at.is_(None)
    )
    rows = (
        await db.execute(
            select(WorkoutSession, WorkoutTemplate.name)
            .outerjoin(WorkoutTemplate, WorkoutTemplate.id == WorkoutSession.template_id)
            .where(WorkoutSession.user_id == user_id, condition)
            .order_by(WorkoutSession.started_at.desc())
        )
    ).all()

    exercises_by_session = await _get_exercises_for_sessions(
        db, [session.id for session, _ in rows]
    )

    return [
        WorkoutSessionRead(
            id=session.id,
            user_id=session.user_id,
            template_id=session.template_id,
            template_name=template_name,
            started_at=session.started_at,
            completed_at=session.completed_at,
            exercises=exercises_by_session[session.id],
        )
        for session, template_name in rows
    ]


async def list_active_workout_sessions_for_user(
    db: AsyncSession, user_id: int
) -> list[WorkoutSessionRead]:
    """Return all in-progress workout sessions (``completed_at`` unset) owned by ``user_id``."""
    return await _list_workout_sessions_for_user(db, user_id, completed=False)


async def list_completed_workout_sessions_for_user(
    db: AsyncSession, user_id: int
) -> list[WorkoutSessionRead]:
    """Return all completed workout sessions (``completed_at`` set) owned by ``user_id``."""
    return await _list_workout_sessions_for_user(db, user_id, completed=True)


async def _get_session_for_user(
    db: AsyncSession, user_id: int, session_id: int
) -> WorkoutSession | None:
    result = await db.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def _get_template_name(db: AsyncSession, template_id: int | None) -> str | None:
    if template_id is None:
        return None
    result = await db.execute(
        select(WorkoutTemplate.name).where(WorkoutTemplate.id == template_id)
    )
    return result.scalar_one_or_none()


async def complete_workout_session_for_user(
    db: AsyncSession, user_id: int, session_id: int
) -> WorkoutSessionRead | None:
    """Mark a workout session owned by ``user_id`` as completed, returning it with updated state.

    ``completed_at`` is set to the current time regardless of its previous
    value. Returns ``None`` if no such session exists for this user.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None

    session.completed_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(session)

    exercises_by_session = await _get_exercises_for_sessions(db, [session.id])
    template_name = await _get_template_name(db, session.template_id)
    return WorkoutSessionRead(
        id=session.id,
        user_id=session.user_id,
        template_id=session.template_id,
        template_name=template_name,
        started_at=session.started_at,
        completed_at=session.completed_at,
        exercises=exercises_by_session[session.id],
    )


async def start_workout_session_from_template(
    db: AsyncSession, user_id: int, template_id: int
) -> WorkoutSessionRead | None:
    """Start a new workout session copying the exercise slots of a template.

    The template must be owned by ``user_id``; returns ``None`` otherwise.
    ``started_at`` is set automatically and ``completed_at`` is left unset, as
    is expected of a freshly started session. Exercise slots are copied over
    in template order, but with no sets recorded yet.
    """
    template = (
        await db.execute(
            select(WorkoutTemplate).where(
                WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if template is None:
        return None

    session = WorkoutSession(user_id=user_id, template_id=template.id)
    db.add(session)
    await db.flush()

    template_exercise_rows = await db.execute(
        select(TemplateExercise, Exercise)
        .join(Exercise, Exercise.id == TemplateExercise.exercise_id)
        .where(TemplateExercise.template_id == template.id)
        .order_by(TemplateExercise.position)
    )

    exercises: list[SessionExerciseRead] = []
    for template_exercise, exercise in template_exercise_rows.all():
        session_exercise = SessionExercise(
            session_id=session.id,
            exercise_id=template_exercise.exercise_id,
            position=template_exercise.position,
        )
        db.add(session_exercise)
        await db.flush()

        exercises.append(
            SessionExerciseRead(
                id=session_exercise.id,
                exercise_id=session_exercise.exercise_id,
                name=exercise.name,
                muscle_group=exercise.muscle_group,
                position=session_exercise.position,
                sets=[],
            )
        )

    await db.refresh(session)
    return WorkoutSessionRead(
        id=session.id,
        user_id=session.user_id,
        template_id=session.template_id,
        template_name=template.name,
        started_at=session.started_at,
        completed_at=session.completed_at,
        exercises=exercises,
    )

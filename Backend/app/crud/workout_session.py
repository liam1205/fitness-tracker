import uuid
from collections import defaultdict
from datetime import UTC, datetime, time, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.data.default_mev_mav_mrv import DEFAULT_MAV, DEFAULT_MEV, DEFAULT_MRV
from app.models.enums import MuscleGroup
from app.models.exercise import Exercise, ExerciseMuscleGroup
from app.models.workout_session import (
    SessionExercise,
    SessionPause,
    SessionSet,
    WorkoutSession,
)
from app.models.workout_template import TemplateExercise, WorkoutTemplate
from app.schemas.workout_session import (
    MuscleGroupSetCount,
    SessionExerciseRead,
    SessionSetRead,
    WeeklyMuscleGroupSets,
    WorkoutSessionRead,
    WorkoutSessionUpdate,
)


_MEV = {group: sets for sets, group in DEFAULT_MEV}
_MAV = {group: sets for sets, group in DEFAULT_MAV}
_MRV = {group: sets for sets, group in DEFAULT_MRV}


async def _get_exercises_for_sessions(
    db: AsyncSession, session_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[SessionExerciseRead]]:
    exercises_by_session: dict[uuid.UUID, list[SessionExerciseRead]] = defaultdict(list)
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

    sets_by_session_exercise: dict[uuid.UUID, list[SessionSetRead]] = defaultdict(list)
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
                primary_muscle_group=exercise.primary_muscle_group,
                secondary_muscle_groups=exercise.secondary_muscle_groups,
                position=session_exercise.position,
                sets=sets_by_session_exercise[session_exercise.id],
            )
        )

    return exercises_by_session


class SessionStateError(Exception):
    """Raised when an operation isn't valid for the session's current state."""


async def _get_pauses_for_sessions(
    db: AsyncSession, session_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[SessionPause]]:
    pauses_by_session: dict[uuid.UUID, list[SessionPause]] = defaultdict(list)
    if not session_ids:
        return pauses_by_session

    pauses = (
        await db.execute(
            select(SessionPause)
            .where(SessionPause.session_id.in_(session_ids))
            .order_by(SessionPause.paused_at)
        )
    ).scalars()
    for pause in pauses:
        pauses_by_session[pause.session_id].append(pause)
    return pauses_by_session


async def _get_open_pause(db: AsyncSession, session_id: uuid.UUID) -> SessionPause | None:
    result = await db.execute(
        select(SessionPause).where(
            SessionPause.session_id == session_id, SessionPause.resumed_at.is_(None)
        )
    )
    return result.scalar_one_or_none()


def _active_seconds(session: WorkoutSession, pauses: list[SessionPause], now: datetime) -> int:
    """Net seconds spent working out: elapsed time minus pauses.

    An open pause counts up to the end of the session (or ``now`` if it is still
    in progress). Each pause is clamped to ``[started_at, end]`` so that edits to
    ``started_at``/``completed_at`` can't produce a negative or inflated total.
    """
    end = session.completed_at or now
    paused = timedelta()
    for pause in pauses:
        pause_start = max(pause.paused_at, session.started_at)
        pause_end = min(pause.resumed_at or end, end)
        if pause_end > pause_start:
            paused += pause_end - pause_start
    return max(0, int((end - session.started_at - paused).total_seconds()))


def _to_read(
    session: WorkoutSession,
    template_name: str | None,
    exercises: list[SessionExerciseRead],
    pauses: list[SessionPause],
    now: datetime,
) -> WorkoutSessionRead:
    open_pause = next((pause for pause in pauses if pause.resumed_at is None), None)
    return WorkoutSessionRead(
        id=session.id,
        user_id=session.user_id,
        template_id=session.template_id,
        template_name=template_name,
        started_at=session.started_at,
        completed_at=session.completed_at,
        is_paused=open_pause is not None,
        paused_at=open_pause.paused_at if open_pause else None,
        active_seconds=_active_seconds(session, pauses, now),
        exercises=exercises,
    )


async def _list_workout_sessions_for_user(
    db: AsyncSession, user_id: uuid.UUID, *, completed: bool
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

    session_ids = [session.id for session, _ in rows]
    exercises_by_session = await _get_exercises_for_sessions(db, session_ids)
    pauses_by_session = await _get_pauses_for_sessions(db, session_ids)
    now = datetime.now(UTC)

    return [
        _to_read(
            session,
            template_name,
            exercises_by_session[session.id],
            pauses_by_session[session.id],
            now,
        )
        for session, template_name in rows
    ]


async def list_active_workout_sessions_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> list[WorkoutSessionRead]:
    """Return all in-progress workout sessions (``completed_at`` unset) owned by ``user_id``."""
    return await _list_workout_sessions_for_user(db, user_id, completed=False)


async def list_completed_workout_sessions_for_user(
    db: AsyncSession, user_id: uuid.UUID
) -> list[WorkoutSessionRead]:
    """Return all completed workout sessions (``completed_at`` set) owned by ``user_id``."""
    return await _list_workout_sessions_for_user(db, user_id, completed=True)


async def get_weekly_muscle_group_sets_for_user(
    db: AsyncSession, user_id: uuid.UUID, weeks_ago: int
) -> WeeklyMuscleGroupSets:
    """Count completed sets per muscle group in a calendar week for ``user_id``.

    Weeks run from Monday 00:00 to the following Monday 00:00 (UTC);
    ``weeks_ago`` of 0 is the current week, 1 the previous one, and so on. A
    set belongs to the week its session was started in, regardless of whether
    the session itself has been completed. Each set counts towards every
    muscle group its exercise trains, weighted by that muscle group's factor.
    Every muscle group is returned, with 0 for those without completed sets.
    Each entry also carries the default MEV/MAV/MRV weekly set thresholds
    (``None`` where none are defined).
    """
    today = datetime.now(UTC).date()
    week_start = today - timedelta(days=today.weekday() + 7 * weeks_ago)
    week_end = week_start + timedelta(days=6)
    range_start = datetime.combine(week_start, time.min, tzinfo=UTC)
    range_end = range_start + timedelta(days=7)

    rows = await db.execute(
        select(ExerciseMuscleGroup.muscle_group, func.sum(ExerciseMuscleGroup.factor))
        .select_from(SessionSet)
        .join(SessionExercise, SessionExercise.id == SessionSet.session_exercise_id)
        .join(WorkoutSession, WorkoutSession.id == SessionExercise.session_id)
        .join(
            ExerciseMuscleGroup,
            ExerciseMuscleGroup.exercise_id == SessionExercise.exercise_id,
        )
        .where(
            WorkoutSession.user_id == user_id,
            WorkoutSession.started_at >= range_start,
            WorkoutSession.started_at < range_end,
            SessionSet.completed.is_(True),
        )
        .group_by(ExerciseMuscleGroup.muscle_group)
    )
    counts = {muscle_group: float(total) for muscle_group, total in rows.all()}

    return WeeklyMuscleGroupSets(
        week_start=week_start,
        week_end=week_end,
        muscle_groups=[
            MuscleGroupSetCount(
                muscle_group=group,
                completed_sets=counts.get(group, 0),
                mev=_MEV.get(group),
                mav=_MAV.get(group),
                mrv=_MRV.get(group),
            )
            for group in MuscleGroup
        ],
    )


async def get_daily_session_counts_for_user(
    db: AsyncSession, user_id: uuid.UUID, weeks: int
) -> list[list[int]]:
    """Count workout sessions per day over the last ``weeks`` calendar weeks for ``user_id``.

    Weeks run from Monday to Sunday (UTC); ``weeks`` of 1 covers only the
    current week. Returns one list per week, oldest first, each holding the
    session count of every day starting on Monday. The current week stops at
    today, so it only holds ``today.weekday() + 1`` entries. A session belongs
    to the day it was started on, regardless of whether it has been completed.
    """
    today = datetime.now(UTC).date()
    first_day = today - timedelta(days=today.weekday() + 7 * (weeks - 1))
    range_start = datetime.combine(first_day, time.min, tzinfo=UTC)
    range_end = datetime.combine(today + timedelta(days=1), time.min, tzinfo=UTC)

    started_ats = (
        await db.execute(
            select(WorkoutSession.started_at).where(
                WorkoutSession.user_id == user_id,
                WorkoutSession.started_at >= range_start,
                WorkoutSession.started_at < range_end,
            )
        )
    ).scalars()

    counts = [0] * ((today - first_day).days + 1)
    for started_at in started_ats:
        counts[(started_at.astimezone(UTC).date() - first_day).days] += 1

    return [counts[i : i + 7] for i in range(0, len(counts), 7)]


async def get_weekly_completed_session_counts_for_user(
    db: AsyncSession, user_id: uuid.UUID, weeks: int
) -> list[int]:
    """Count completed workout sessions per week over the last ``weeks`` calendar weeks for ``user_id``.

    Weeks run from Monday 00:00 to the following Monday 00:00 (UTC); ``weeks``
    of 1 covers only the current week. Returns one count per week, oldest
    first. Only sessions with ``completed_at`` set are counted, and a session
    belongs to the week it was started in.
    """
    today = datetime.now(UTC).date()
    first_day = today - timedelta(days=today.weekday() + 7 * (weeks - 1))
    range_start = datetime.combine(first_day, time.min, tzinfo=UTC)
    range_end = range_start + timedelta(weeks=weeks)

    started_ats = (
        await db.execute(
            select(WorkoutSession.started_at).where(
                WorkoutSession.user_id == user_id,
                WorkoutSession.completed_at.is_not(None),
                WorkoutSession.started_at >= range_start,
                WorkoutSession.started_at < range_end,
            )
        )
    ).scalars()

    counts = [0] * weeks
    for started_at in started_ats:
        counts[(started_at.astimezone(UTC).date() - first_day).days // 7] += 1

    return counts


async def _get_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSession | None:
    result = await db.execute(
        select(WorkoutSession).where(
            WorkoutSession.id == session_id, WorkoutSession.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def _get_template_name(db: AsyncSession, template_id: uuid.UUID | None) -> str | None:
    if template_id is None:
        return None
    result = await db.execute(
        select(WorkoutTemplate.name).where(WorkoutTemplate.id == template_id)
    )
    return result.scalar_one_or_none()


async def _build_session_read(db: AsyncSession, session: WorkoutSession) -> WorkoutSessionRead:
    exercises_by_session = await _get_exercises_for_sessions(db, [session.id])
    pauses_by_session = await _get_pauses_for_sessions(db, [session.id])
    template_name = await _get_template_name(db, session.template_id)
    return _to_read(
        session,
        template_name,
        exercises_by_session[session.id],
        pauses_by_session[session.id],
        datetime.now(UTC),
    )


async def get_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSessionRead | None:
    """Return a single workout session owned by ``user_id``, or ``None`` if not found."""
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None

    return await _build_session_read(db, session)


async def complete_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSessionRead | None:
    """Mark a workout session owned by ``user_id`` as completed, returning it with updated state.

    ``completed_at`` is set to the current time regardless of its previous
    value. Returns ``None`` if no such session exists for this user. Raises
    ``SessionStateError`` if the session is paused; it must be resumed first.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None
    if await _get_open_pause(db, session.id) is not None:
        raise SessionStateError("Resume the workout session before completing it")

    session.completed_at = datetime.now(UTC)
    await db.flush()
    await db.refresh(session)

    return await _build_session_read(db, session)


async def pause_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSessionRead | None:
    """Pause an in-progress workout session owned by ``user_id``.

    Returns ``None`` if no such session exists for this user. Raises
    ``SessionStateError`` if the session is completed or already paused.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None
    if session.completed_at is not None:
        raise SessionStateError("Workout session is already completed")
    if await _get_open_pause(db, session.id) is not None:
        raise SessionStateError("Workout session is already paused")

    try:
        async with db.begin_nested():
            db.add(SessionPause(session_id=session.id, paused_at=datetime.now(UTC)))
    except IntegrityError:
        # A concurrent request opened a pause between our check and the insert.
        raise SessionStateError("Workout session is already paused") from None

    return await _build_session_read(db, session)


async def resume_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> WorkoutSessionRead | None:
    """Resume a paused workout session owned by ``user_id``.

    Returns ``None`` if no such session exists for this user. Raises
    ``SessionStateError`` if the session isn't paused.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None
    open_pause = await _get_open_pause(db, session.id)
    if open_pause is None:
        raise SessionStateError("Workout session is not paused")

    open_pause.resumed_at = datetime.now(UTC)
    await db.flush()

    return await _build_session_read(db, session)


async def update_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID, payload: WorkoutSessionUpdate
) -> WorkoutSessionRead | None:
    """Update a workout session owned by ``user_id``. Returns ``None`` if not found.

    Omitted fields are left unchanged; ``template_id`` and ``completed_at`` can
    be cleared by sending ``null``. When ``exercises`` is provided, the existing
    exercise slots and their sets are replaced wholesale, with ``position`` and
    ``set_number`` reassigned from list order. Raises ``SessionStateError`` when
    setting ``completed_at`` on a paused session.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return None

    fields = payload.model_fields_set
    if (
        "completed_at" in fields
        and payload.completed_at is not None
        and await _get_open_pause(db, session.id) is not None
    ):
        raise SessionStateError("Resume the workout session before completing it")
    if "template_id" in fields:
        session.template_id = payload.template_id
    if "started_at" in fields:
        session.started_at = payload.started_at
    if "completed_at" in fields:
        session.completed_at = payload.completed_at

    if payload.exercises is not None:
        existing_ids = select(SessionExercise.id).where(SessionExercise.session_id == session.id)
        await db.execute(
            delete(SessionSet).where(SessionSet.session_exercise_id.in_(existing_ids))
        )
        await db.execute(delete(SessionExercise).where(SessionExercise.session_id == session.id))
        for position, exercise_payload in enumerate(payload.exercises, start=1):
            session_exercise = SessionExercise(
                session_id=session.id,
                exercise_id=exercise_payload.exercise_id,
                position=position,
            )
            db.add(session_exercise)
            await db.flush()
            for set_number, set_payload in enumerate(exercise_payload.sets, start=1):
                db.add(
                    SessionSet(
                        session_exercise_id=session_exercise.id,
                        set_number=set_number,
                        reps=set_payload.reps,
                        weight=set_payload.weight,
                        completed=set_payload.completed,
                    )
                )

    await db.flush()
    await db.refresh(session)

    return await _build_session_read(db, session)


async def delete_workout_session_for_user(
    db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID
) -> bool:
    """Delete a workout session owned by ``user_id``, along with its pauses, exercises and sets.

    Returns ``False`` if no such session exists for this user.
    """
    session = await _get_session_for_user(db, user_id, session_id)
    if session is None:
        return False

    existing_ids = select(SessionExercise.id).where(SessionExercise.session_id == session.id)
    await db.execute(delete(SessionSet).where(SessionSet.session_exercise_id.in_(existing_ids)))
    await db.execute(delete(SessionExercise).where(SessionExercise.session_id == session.id))
    await db.execute(delete(SessionPause).where(SessionPause.session_id == session.id))
    await db.delete(session)
    await db.flush()
    return True


async def start_workout_session_from_template(
    db: AsyncSession, user_id: uuid.UUID, template_id: uuid.UUID
) -> WorkoutSessionRead | None:
    """Start a new workout session copying the exercise slots of a template.

    The template must be owned by ``user_id``; returns ``None`` otherwise.
    ``started_at`` is set automatically and ``completed_at`` is left unset, as
    is expected of a freshly started session. Exercise slots are copied over
    in template order, each pre-populated with the number of empty sets
    (``reps``/``weight`` unset) given by the template exercise's
    ``set_count``.
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

        sets: list[SessionSetRead] = []
        for set_number in range(1, template_exercise.set_count + 1):
            session_set = SessionSet(
                session_exercise_id=session_exercise.id,
                set_number=set_number,
            )
            db.add(session_set)
            await db.flush()
            sets.append(
                SessionSetRead(
                    id=session_set.id,
                    set_number=session_set.set_number,
                    reps=session_set.reps,
                    weight=session_set.weight,
                    completed=session_set.completed,
                )
            )

        exercises.append(
            SessionExerciseRead(
                id=session_exercise.id,
                exercise_id=session_exercise.exercise_id,
                name=exercise.name,
                primary_muscle_group=exercise.primary_muscle_group,
                secondary_muscle_groups=exercise.secondary_muscle_groups,
                position=session_exercise.position,
                sets=sets,
            )
        )

    await db.refresh(session)
    return _to_read(session, template.name, exercises, [], datetime.now(UTC))

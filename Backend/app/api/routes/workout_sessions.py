import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.crud.workout_session import SessionStateError
from app.schemas.workout_session import (
    WorkoutSessionRead,
    WorkoutSessionStart,
    WorkoutSessionUpdate,
)

router = APIRouter(prefix="/workout-sessions", tags=["workout-sessions"])


@router.get(
    "/active",
    response_model=list[WorkoutSessionRead],
    summary="List active workout sessions",
)
async def list_active_workout_sessions(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[WorkoutSessionRead]:
    """Return the current user's workout sessions that haven't been completed yet."""
    return await crud.workout_session.list_active_workout_sessions_for_user(db, user.id)


@router.get(
    "/completed",
    response_model=list[WorkoutSessionRead],
    summary="List completed workout sessions",
)
async def list_completed_workout_sessions(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[WorkoutSessionRead]:
    """Return the current user's workout sessions that have been completed."""
    return await crud.workout_session.list_completed_workout_sessions_for_user(db, user.id)


@router.get(
    "/{session_id}",
    response_model=WorkoutSessionRead,
    summary="Get a workout session by ID",
)
async def get_workout_session(
    session_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Return a single workout session owned by the current user."""
    session = await crud.workout_session.get_workout_session_for_user(db, user.id, session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session


@router.post(
    "/start",
    response_model=WorkoutSessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="Start a workout session from a template",
)
async def start_workout_session(
    payload: WorkoutSessionStart,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Start a new workout session copying the exercises of a template owned by the current user."""
    session = await crud.workout_session.start_workout_session_from_template(
        db, user.id, payload.template_id
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return session


@router.post(
    "/{session_id}/pause",
    response_model=WorkoutSessionRead,
    summary="Pause a workout session",
)
async def pause_workout_session(
    session_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Pause an in-progress workout session. Responds with 409 if it is completed or paused."""
    try:
        session = await crud.workout_session.pause_workout_session_for_user(
            db, user.id, session_id
        )
    except SessionStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session


@router.post(
    "/{session_id}/resume",
    response_model=WorkoutSessionRead,
    summary="Resume a paused workout session",
)
async def resume_workout_session(
    session_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Resume a paused workout session. Responds with 409 if it isn't paused."""
    try:
        session = await crud.workout_session.resume_workout_session_for_user(
            db, user.id, session_id
        )
    except SessionStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session


@router.post(
    "/{session_id}/complete",
    response_model=WorkoutSessionRead,
    summary="Complete a workout session",
)
async def complete_workout_session(
    session_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Mark a workout session owned by the current user as completed.

    A paused session must be resumed first; otherwise responds with 409.
    """
    try:
        session = await crud.workout_session.complete_workout_session_for_user(
            db, user.id, session_id
        )
    except SessionStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workout session",
)
async def delete_workout_session(
    session_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a workout session owned by the current user."""
    deleted = await crud.workout_session.delete_workout_session_for_user(db, user.id, session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )


@router.patch(
    "/{session_id}",
    response_model=WorkoutSessionRead,
    summary="Update a workout session",
)
async def update_workout_session(
    session_id: uuid.UUID,
    payload: WorkoutSessionUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Update a workout session owned by the current user. Omitted fields are left unchanged."""
    if payload.template_id is not None:
        template = await crud.workout_template.get_workout_template_for_user(
            db, user.id, payload.template_id
        )
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    if payload.exercises is not None:
        for exercise_payload in payload.exercises:
            exercise = await crud.exercise.get_exercise_for_user(
                db, user.id, exercise_payload.exercise_id
            )
            if exercise is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Exercise {exercise_payload.exercise_id} not found",
                )

    try:
        session = await crud.workout_session.update_workout_session_for_user(
            db, user.id, session_id, payload
        )
    except SessionStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session

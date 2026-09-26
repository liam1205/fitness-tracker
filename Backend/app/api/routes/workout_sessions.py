from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.workout_session import WorkoutSessionRead, WorkoutSessionStart

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
    "/{session_id}/complete",
    response_model=WorkoutSessionRead,
    summary="Complete a workout session",
)
async def complete_workout_session(
    session_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutSessionRead:
    """Mark a workout session owned by the current user as completed."""
    session = await crud.workout_session.complete_workout_session_for_user(
        db, user.id, session_id
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workout session not found"
        )
    return session

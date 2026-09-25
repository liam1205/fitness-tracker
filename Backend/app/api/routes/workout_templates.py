from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.workout_template import (
    WorkoutTemplateCreate,
    WorkoutTemplateRead,
    WorkoutTemplateUpdate,
)

router = APIRouter(prefix="/workout-templates", tags=["workout-templates"])


@router.get("", response_model=list[WorkoutTemplateRead], summary="List workout templates")
async def list_workout_templates(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list[WorkoutTemplateRead]:
    """Return all of the current user's workout templates."""
    return await crud.workout_template.list_workout_templates_for_user(db, user.id)


@router.post(
    "",
    response_model=WorkoutTemplateRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a workout template",
)
async def create_workout_template(
    payload: WorkoutTemplateCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutTemplateRead:
    """Create a new workout template owned by the current user."""
    for exercise_payload in payload.exercises:
        exercise = await crud.exercise.get_exercise_for_user(
            db, user.id, exercise_payload.exercise_id
        )
        if exercise is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Exercise {exercise_payload.exercise_id} not found",
            )
    return await crud.workout_template.create_workout_template_for_user(db, user.id, payload)


@router.get(
    "/{template_id}",
    response_model=WorkoutTemplateRead,
    summary="Get a workout template",
)
async def get_workout_template(
    template_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutTemplateRead:
    """Return a single workout template owned by the current user."""
    template = await crud.workout_template.get_workout_template_for_user(
        db, user.id, template_id
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.patch(
    "/{template_id}",
    response_model=WorkoutTemplateRead,
    summary="Update a workout template",
)
async def update_workout_template(
    template_id: int,
    payload: WorkoutTemplateUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> WorkoutTemplateRead:
    """Update a workout template owned by the current user. Omitted fields are left unchanged."""
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

    template = await crud.workout_template.update_workout_template_for_user(
        db, user.id, template_id, payload
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


@router.delete(
    "/{template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workout template",
)
async def delete_workout_template(
    template_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a workout template owned by the current user."""
    deleted = await crud.workout_template.delete_workout_template_for_user(
        db, user.id, template_id
    )
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

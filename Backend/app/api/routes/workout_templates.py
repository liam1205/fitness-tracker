from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.workout_template import WorkoutTemplateCreate, WorkoutTemplateRead

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

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.exercise import ExerciseCreate, ExerciseRead, ExerciseUpdate
from app.schemas.pagination import Page

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=Page[ExerciseRead], summary="List exercises")
async def list_exercises(
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number (1-indexed)."),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page."),
) -> Page[ExerciseRead]:
    """Return a page of the current user's exercises."""
    exercises, total = await crud.exercise.list_exercises_for_user(db, user.id, page, page_size)
    pages = (total + page_size - 1) // page_size if total else 0
    return Page(items=exercises, total=total, page=page, page_size=page_size, pages=pages)


@router.post(
    "",
    response_model=ExerciseRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an exercise",
)
async def create_exercise(
    payload: ExerciseCreate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ExerciseRead:
    """Create a new exercise owned by the current user."""
    return await crud.exercise.create_exercise_for_user(db, user.id, payload)


@router.patch("/{exercise_id}", response_model=ExerciseRead, summary="Update an exercise")
async def update_exercise(
    exercise_id: int,
    payload: ExerciseUpdate,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ExerciseRead:
    """Update an exercise owned by the current user. Omitted fields are left unchanged."""
    exercise = await crud.exercise.update_exercise_for_user(db, user.id, exercise_id, payload)
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")
    return exercise


@router.delete(
    "/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an exercise"
)
async def delete_exercise(
    exercise_id: int,
    user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an exercise owned by the current user."""
    deleted = await crud.exercise.delete_exercise_for_user(db, user.id, exercise_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

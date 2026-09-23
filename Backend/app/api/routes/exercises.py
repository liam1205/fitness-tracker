from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api.deps import CurrentUser
from app.db import get_db
from app.schemas.exercise import ExerciseRead
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

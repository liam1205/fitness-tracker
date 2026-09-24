from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workout_session import WorkoutSession


async def list_workout_sessions_for_user(db: AsyncSession, user_id: int) -> list[WorkoutSession]:
    """Return all workout sessions owned by ``user_id``, most recent first."""
    result = await db.execute(
        select(WorkoutSession)
        .where(WorkoutSession.user_id == user_id)
        .order_by(WorkoutSession.started_at.desc())
    )
    return list(result.scalars().all())

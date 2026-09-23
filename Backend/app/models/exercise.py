from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import MuscleGroup, pg_enum


class Exercise(Base):
    """A movement that can appear in templates and sessions.

    ``created_by`` is nullable so built-in exercises (seeded, not owned by any
    user) and exercises whose creator account was later deleted can both exist.
    """

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    muscle_group: Mapped[MuscleGroup] = mapped_column(pg_enum(MuscleGroup, "muscle_group_enum"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

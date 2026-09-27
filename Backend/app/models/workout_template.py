import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WorkoutTemplate(Base):
    """A reusable workout plan a user can start sessions from."""

    __tablename__ = "workout_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class TemplateExercise(Base):
    """One exercise slot within a workout template, in display order."""

    __tablename__ = "template_exercises"
    __table_args__ = (
        UniqueConstraint("template_id", "position", name="uq_template_exercises_template_id_position"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)
    set_count: Mapped[int] = mapped_column(Integer)

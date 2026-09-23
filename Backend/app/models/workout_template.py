from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WorkoutTemplate(Base):
    """A reusable workout plan a user can start sessions from."""

    __tablename__ = "workout_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
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

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)


class TemplateSet(Base):
    """A planned set (target reps/weight) for a template exercise slot."""

    __tablename__ = "template_sets"
    __table_args__ = (
        UniqueConstraint(
            "template_exercise_id",
            "set_number",
            name="uq_template_sets_template_exercise_id_set_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    template_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("template_exercises.id", ondelete="CASCADE")
    )
    set_number: Mapped[int] = mapped_column(Integer)
    target_reps: Mapped[int] = mapped_column(Integer)
    target_weight: Mapped[Decimal] = mapped_column(Numeric(6, 2))

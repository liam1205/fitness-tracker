from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    false,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WorkoutSession(Base):
    """A single workout in progress or completed by a user.

    ``template_id`` is nullable so ad-hoc (template-less) workouts are
    possible, and so a session's history survives if its template is deleted.
    """

    __tablename__ = "workout_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int | None] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SessionExercise(Base):
    """One exercise slot within a workout session, in performed order."""

    __tablename__ = "session_exercises"
    __table_args__ = (
        UniqueConstraint("session_id", "position", name="uq_session_exercises_session_id_position"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"), index=True)
    position: Mapped[int] = mapped_column(Integer)


class SessionSet(Base):
    """An actual set (reps/weight performed) for a session exercise slot."""

    __tablename__ = "session_sets"
    __table_args__ = (
        UniqueConstraint(
            "session_exercise_id",
            "set_number",
            name="uq_session_sets_session_exercise_id_set_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    session_exercise_id: Mapped[int] = mapped_column(
        ForeignKey("session_exercises.id", ondelete="CASCADE")
    )
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int] = mapped_column(Integer)
    weight: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    completed: Mapped[bool] = mapped_column(Boolean, server_default=false(), default=False)

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    UniqueConstraint,
    false,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class WorkoutSession(Base):
    """A single workout in progress or completed by a user.

    ``template_id`` is nullable so ad-hoc (template-less) workouts are
    possible, and so a session's history survives if its template is deleted.
    """

    __tablename__ = "workout_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("workout_templates.id", ondelete="SET NULL"), index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), index=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SessionPause(Base):
    """A pause interval within a workout session.

    A session is paused while it has a row with ``resumed_at`` unset. The
    partial unique index guarantees at most one such open pause per session.
    """

    __tablename__ = "session_pauses"
    __table_args__ = (
        Index(
            "uq_session_pauses_open_per_session",
            "session_id",
            unique=True,
            postgresql_where=text("resumed_at IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE"), index=True
    )
    paused_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class SessionExercise(Base):
    """One exercise slot within a workout session, in performed order."""

    __tablename__ = "session_exercises"
    __table_args__ = (
        UniqueConstraint("session_id", "position", name="uq_session_exercises_session_id_position"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("workout_sessions.id", ondelete="CASCADE")
    )
    exercise_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("exercises.id"), index=True)
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

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_exercise_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("session_exercises.id", ondelete="CASCADE")
    )
    set_number: Mapped[int] = mapped_column(Integer)
    reps: Mapped[int | None] = mapped_column(Integer)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    completed: Mapped[bool] = mapped_column(Boolean, server_default=false(), default=False)

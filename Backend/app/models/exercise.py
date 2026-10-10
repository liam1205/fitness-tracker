import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    false,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import MuscleGroup, pg_enum


class ExerciseMuscleGroup(Base):
    """How strongly an exercise trains one muscle group.

    ``factor`` weights each completed set when counting weekly volume, e.g. a
    set of bench press counts 1.0 for chest and 0.5 for triceps. Each exercise
    has exactly one primary muscle group; the partial unique index enforces "at
    most one" and the API schemas require one on every write.
    """

    __tablename__ = "exercise_muscle_groups"
    __table_args__ = (
        CheckConstraint(
            "factor > 0 AND factor <= 1", name="ck_exercise_muscle_groups_factor_range"
        ),
        Index(
            "uq_exercise_muscle_groups_one_primary",
            "exercise_id",
            unique=True,
            postgresql_where=text("is_primary"),
        ),
    )

    exercise_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("exercises.id", ondelete="CASCADE"), primary_key=True
    )
    muscle_group: Mapped[MuscleGroup] = mapped_column(
        pg_enum(MuscleGroup, "muscle_group_enum"), primary_key=True
    )
    factor: Mapped[Decimal] = mapped_column(Numeric(3, 2))
    is_primary: Mapped[bool] = mapped_column(default=False, server_default=false())


class Exercise(Base):
    """A movement that can appear in templates and sessions.

    ``created_by`` is nullable so built-in exercises (seeded, not owned by any
    user) and exercises whose creator account was later deleted can both exist.
    """

    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("user.id", ondelete="SET NULL"), index=True
    )
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    # selectin so the rows are loaded up front; lazy loading isn't possible
    # under the async session.
    muscle_groups: Mapped[list[ExerciseMuscleGroup]] = relationship(
        cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def primary_muscle_group(self) -> ExerciseMuscleGroup:
        return next(m for m in self.muscle_groups if m.is_primary)

    @property
    def secondary_muscle_groups(self) -> list[ExerciseMuscleGroup]:
        return sorted(
            (m for m in self.muscle_groups if not m.is_primary),
            key=lambda m: m.factor,
            reverse=True,
        )

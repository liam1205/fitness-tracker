import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import MuscleGroup
from app.schemas.exercise import MuscleGroupFactor


class SessionSetRead(BaseModel):
    """A single performed set within a session exercise, as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique identifier.")
    set_number: int = Field(..., description="Set order within the exercise, 1-indexed.")
    reps: int | None = Field(None, description="Reps performed, once recorded.")
    weight: Decimal | None = Field(None, description="Weight used, once recorded.")
    completed: bool = Field(..., description="Whether this set has been marked done.")


class SessionExerciseRead(BaseModel):
    """An exercise slot within a workout session, as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique identifier.")
    exercise_id: uuid.UUID = Field(..., description="Id of the exercise in this slot.")
    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    primary_muscle_group: MuscleGroupFactor = Field(
        ..., description="Muscle group the exercise mainly targets."
    )
    secondary_muscle_groups: list[MuscleGroupFactor] = Field(
        ..., description="Other muscle groups the exercise trains, highest factor first."
    )
    position: int = Field(..., description="Display order within the session, 1-indexed.")
    sets: list[SessionSetRead] = Field(
        ..., description="Sets performed for this exercise, in order."
    )


class WorkoutSessionRead(BaseModel):
    """A workout session as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique identifier.")
    user_id: uuid.UUID = Field(..., description="Id of the user who owns this session.")
    template_id: uuid.UUID | None = Field(
        None, description="Id of the template this session was started from, if any."
    )
    template_name: str | None = Field(
        None, description="Name of the template this session was started from, if any."
    )
    started_at: datetime = Field(..., description="When the session was started.")
    completed_at: datetime | None = Field(
        None, description="When the session was completed, if it has been."
    )
    is_paused: bool = Field(..., description="Whether the session is currently paused.")
    paused_at: datetime | None = Field(
        None, description="When the current pause began, if the session is paused."
    )
    active_seconds: int = Field(
        ...,
        description=(
            "Net time spent working out, in seconds: elapsed time since ``started_at`` "
            "(until ``completed_at``, or now if still in progress) minus all pauses."
        ),
    )
    exercises: list[SessionExerciseRead] = Field(..., description="Exercise slots, in order.")


class MuscleGroupSetCount(BaseModel):
    """Weighted number of completed sets for one muscle group."""

    muscle_group: MuscleGroup = Field(..., description="Muscle group the sets were performed for.")
    completed_sets: float = Field(
        ...,
        ge=0,
        description=(
            "Completed sets, each weighted by the exercise's factor for this muscle group "
            "(e.g. a bench press set adds 1 to chest and 0.5 to triceps)."
        ),
        examples=[7.5],
    )
    mev: int | None = Field(
        None, description="Minimum effective volume: weekly sets needed to grow, if defined."
    )
    mav: int | None = Field(
        None, description="Maximum adaptive volume: weekly sets for optimal growth, if defined."
    )
    mrv: int | None = Field(
        None, description="Maximum recoverable volume: weekly sets beyond which recovery suffers."
    )


class WeeklyMuscleGroupSets(BaseModel):
    """Completed sets per muscle group for one calendar week (Monday to Sunday, UTC)."""

    week_start: date = Field(..., description="Monday of the calendar week.")
    week_end: date = Field(..., description="Sunday of the calendar week.")
    muscle_groups: list[MuscleGroupSetCount] = Field(
        ..., description="Completed set count for every muscle group, including those with 0."
    )


class WorkoutSessionStart(BaseModel):
    """Payload for starting a new workout session from a template."""

    template_id: uuid.UUID = Field(..., description="Id of the template to start a session from.")


class SessionSetUpdate(BaseModel):
    """A set within a session exercise, as submitted when updating a session."""

    reps: int | None = Field(None, ge=0, description="Reps performed, once recorded.")
    weight: Decimal | None = Field(
        None, ge=0, max_digits=6, decimal_places=2, description="Weight used, once recorded."
    )
    completed: bool = Field(False, description="Whether this set has been marked done.")


class SessionExerciseUpdate(BaseModel):
    """An exercise slot within a session, as submitted when updating a session."""

    exercise_id: uuid.UUID = Field(..., description="Id of the exercise in this slot.")
    sets: list[SessionSetUpdate] = Field(
        default_factory=list, description="Sets for this exercise, in order."
    )


class WorkoutSessionUpdate(BaseModel):
    """Payload for updating a workout session. Omitted fields are left unchanged.

    ``template_id`` and ``completed_at`` may be set to ``null`` explicitly to
    clear them (e.g. reopening a completed session). When ``exercises`` is
    provided, it replaces the entire set of exercise slots and their sets;
    ``position`` and ``set_number`` are assigned from list order.
    """

    template_id: uuid.UUID | None = Field(
        None, description="Id of the template this session is associated with."
    )
    started_at: datetime | None = Field(None, description="When the session was started.")
    completed_at: datetime | None = Field(None, description="When the session was completed.")
    exercises: list[SessionExerciseUpdate] | None = Field(
        None, description="Replacement exercise slots, in order."
    )

    @model_validator(mode="after")
    def started_at_must_not_be_null(self) -> "WorkoutSessionUpdate":
        if "started_at" in self.model_fields_set and self.started_at is None:
            raise ValueError("started_at must not be null.")
        if "exercises" in self.model_fields_set and self.exercises is None:
            raise ValueError("exercises must not be null.")
        if (
            self.started_at is not None
            and self.completed_at is not None
            and self.completed_at < self.started_at
        ):
            raise ValueError("completed_at must not be before started_at.")
        return self

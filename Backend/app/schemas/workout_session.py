from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MuscleGroup


class SessionSetRead(BaseModel):
    """A single performed set within a session exercise, as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.")
    set_number: int = Field(..., description="Set order within the exercise, 1-indexed.")
    reps: int = Field(..., description="Reps performed.")
    weight: Decimal = Field(..., description="Weight used.")
    completed: bool = Field(..., description="Whether this set has been marked done.")


class SessionExerciseRead(BaseModel):
    """An exercise slot within a workout session, as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.")
    exercise_id: int = Field(..., description="Id of the exercise in this slot.")
    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    muscle_group: MuscleGroup = Field(..., description="Primary muscle group targeted.")
    position: int = Field(..., description="Display order within the session, 1-indexed.")
    sets: list[SessionSetRead] = Field(
        ..., description="Sets performed for this exercise, in order."
    )


class WorkoutSessionRead(BaseModel):
    """A workout session as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.", examples=[1])
    user_id: int = Field(..., description="Id of the user who owns this session.")
    template_id: int | None = Field(
        None, description="Id of the template this session was started from, if any."
    )
    template_name: str | None = Field(
        None, description="Name of the template this session was started from, if any."
    )
    started_at: datetime = Field(..., description="When the session was started.")
    completed_at: datetime | None = Field(
        None, description="When the session was completed, if it has been."
    )
    exercises: list[SessionExerciseRead] = Field(..., description="Exercise slots, in order.")


class WorkoutSessionStart(BaseModel):
    """Payload for starting a new workout session from a template."""

    template_id: int = Field(..., description="Id of the template to start a session from.")

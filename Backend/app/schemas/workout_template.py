from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MuscleGroup


class TemplateExerciseCreate(BaseModel):
    """Payload for one exercise slot within a new workout template."""

    exercise_id: int = Field(..., description="Id of the exercise to add.")
    set_count: int = Field(..., gt=0, description="Number of planned sets.", examples=[3])


class TemplateExerciseRead(BaseModel):
    """An exercise slot within a workout template, as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.")
    exercise_id: int = Field(..., description="Id of the exercise in this slot.")
    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    muscle_group: MuscleGroup = Field(..., description="Primary muscle group targeted.")
    position: int = Field(..., description="Display order within the template, 1-indexed.")
    set_count: int = Field(..., description="Number of planned sets.")


class WorkoutTemplateRead(BaseModel):
    """A workout template as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.", examples=[1])
    user_id: int = Field(..., description="Id of the user who owns this template.")
    name: str = Field(..., description="Template name.", examples=["Push Day"])
    created_at: datetime = Field(..., description="When the template was created.")
    exercises: list[TemplateExerciseRead] = Field(..., description="Exercise slots, in order.")


class WorkoutTemplateCreate(BaseModel):
    """Payload for creating a new workout template."""

    name: str = Field(..., description="Template name.", examples=["Push Day"])
    exercises: list[TemplateExerciseCreate] = Field(
        default_factory=list, description="Exercise slots to add, in order."
    )

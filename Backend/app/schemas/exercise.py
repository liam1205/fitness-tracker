from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import MuscleGroup


class ExerciseRead(BaseModel):
    """An exercise as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.", examples=[1])
    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    muscle_group: MuscleGroup = Field(..., description="Primary muscle group targeted.")
    created_by: int | None = Field(
        None, description="Id of the user who created this exercise, if any."
    )
    created_at: datetime = Field(..., description="When the exercise was created.")


class ExerciseCreate(BaseModel):
    """Payload for creating a new exercise."""

    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    muscle_group: MuscleGroup = Field(..., description="Primary muscle group targeted.")


class ExerciseUpdate(BaseModel):
    """Payload for updating an exercise. Omitted fields are left unchanged."""

    name: str | None = Field(None, description="Exercise name.", examples=["Bench Press"])
    muscle_group: MuscleGroup | None = Field(
        None, description="Primary muscle group targeted."
    )

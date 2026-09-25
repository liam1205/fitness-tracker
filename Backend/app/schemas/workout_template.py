from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

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

    name: str = Field(..., min_length=1, description="Template name.", examples=["Push Day"])
    exercises: list[TemplateExerciseCreate] = Field(
        ..., min_length=1, description="Exercise slots to add, in order."
    )

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Template name must not be blank.")
        return stripped


class WorkoutTemplateUpdate(BaseModel):
    """Payload for updating a workout template. Omitted fields are left unchanged.

    When ``exercises`` is provided, it replaces the entire set of slots;
    position is assigned from list order, so reordering is done by
    resubmitting the list in the desired order.
    """

    name: str | None = Field(None, min_length=1, description="Template name.", examples=["Push Day"])
    exercises: list[TemplateExerciseCreate] | None = Field(
        None, min_length=1, description="Replacement exercise slots, in order."
    )

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is None:
            return value
        stripped = value.strip()
        if not stripped:
            raise ValueError("Template name must not be blank.")
        return stripped

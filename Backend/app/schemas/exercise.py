import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.enums import MuscleGroup


class MuscleGroupFactor(BaseModel):
    """A muscle group an exercise trains, weighted by how strongly it trains it."""

    model_config = ConfigDict(from_attributes=True)

    muscle_group: MuscleGroup = Field(..., description="Muscle group trained.")
    factor: float = Field(
        ...,
        gt=0,
        le=1,
        description=(
            "How much one completed set counts towards this muscle group's weekly "
            "volume, with at most two decimal places."
        ),
        examples=[0.5],
    )

    @field_validator("factor")
    @classmethod
    def factor_must_have_two_decimals(cls, factor: float) -> float:
        if round(factor, 2) != factor:
            raise ValueError("factor must have at most two decimal places.")
        return factor


def _check_muscle_groups(
    primary: MuscleGroupFactor, secondaries: list[MuscleGroupFactor]
) -> None:
    groups = [primary.muscle_group, *(s.muscle_group for s in secondaries)]
    if len(groups) != len(set(groups)):
        raise ValueError("Each muscle group may only appear once per exercise.")
    if any(s.factor > primary.factor for s in secondaries):
        raise ValueError("A secondary muscle group's factor must not exceed the primary's.")


class ExerciseRead(BaseModel):
    """An exercise as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Unique identifier.")
    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    primary_muscle_group: MuscleGroupFactor = Field(
        ..., description="Muscle group the exercise mainly targets."
    )
    secondary_muscle_groups: list[MuscleGroupFactor] = Field(
        ..., description="Other muscle groups the exercise trains, highest factor first."
    )
    created_by: uuid.UUID | None = Field(
        None, description="Id of the user who created this exercise, if any."
    )
    created_at: datetime = Field(..., description="When the exercise was created.")


class ExerciseCreate(BaseModel):
    """Payload for creating a new exercise."""

    name: str = Field(..., description="Exercise name.", examples=["Bench Press"])
    primary_muscle_group: MuscleGroupFactor = Field(
        ..., description="Muscle group the exercise mainly targets."
    )
    secondary_muscle_groups: list[MuscleGroupFactor] = Field(
        default_factory=list,
        description="Other muscle groups the exercise trains. Factors must not exceed the primary's.",
    )

    @model_validator(mode="after")
    def check_muscle_groups(self) -> "ExerciseCreate":
        _check_muscle_groups(self.primary_muscle_group, self.secondary_muscle_groups)
        return self


class ExerciseUpdate(BaseModel):
    """Payload for updating an exercise. Omitted fields are left unchanged.

    The muscle groups are replaced as a whole, so ``primary_muscle_group`` and
    ``secondary_muscle_groups`` must be sent together or not at all.
    """

    name: str | None = Field(None, description="Exercise name.", examples=["Bench Press"])
    primary_muscle_group: MuscleGroupFactor | None = Field(
        None, description="Muscle group the exercise mainly targets."
    )
    secondary_muscle_groups: list[MuscleGroupFactor] | None = Field(
        None,
        description="Other muscle groups the exercise trains. Factors must not exceed the primary's.",
    )

    @model_validator(mode="after")
    def check_muscle_groups(self) -> "ExerciseUpdate":
        if (self.primary_muscle_group is None) != (self.secondary_muscle_groups is None):
            raise ValueError(
                "primary_muscle_group and secondary_muscle_groups must be sent together."
            )
        if self.primary_muscle_group is not None and self.secondary_muscle_groups is not None:
            _check_muscle_groups(self.primary_muscle_group, self.secondary_muscle_groups)
        return self

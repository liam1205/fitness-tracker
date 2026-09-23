from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Language, Theme


class UserSettingsRead(BaseModel):
    """A user's settings as returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    language: Language = Field(..., description="Preferred UI language.")
    theme: Theme = Field(..., description="Preferred UI theme.")


class UserSettingsUpdate(BaseModel):
    """Payload for updating a user's settings. Omitted fields are left unchanged."""

    language: Language | None = Field(None, description="Preferred UI language.")
    theme: Theme | None = Field(None, description="Preferred UI theme.")

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email address.", examples=["user@example.com"])
    first_name: str = Field(..., max_length=100, description="Given name.", examples=["Jane"])
    last_name: str = Field(..., max_length=100, description="Family name.", examples=["Doe"])


class UserCreate(UserBase):
    """Payload for creating a user. The password is stored hashed, never in plaintext."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Plaintext password (min 8 characters).",
    )


class UserLogin(BaseModel):
    """Credentials for signing in. Users authenticate by email."""

    email: EmailStr = Field(..., description="User email address.", examples=["user@example.com"])
    password: str = Field(..., description="Plaintext password.")


class UserRead(UserBase):
    """A user as returned by the API. Never includes the password hash."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier.", examples=[1])
    is_active: bool = Field(..., description="Whether the account is active.")
    is_superuser: bool = Field(..., description="Whether the account has elevated privileges.")
    created_at: datetime = Field(..., description="When the account was created.")

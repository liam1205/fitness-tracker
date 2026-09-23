from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import Language, Theme, pg_enum


class UserSettings(Base):
    """A user's preferences. One-to-one with ``user`` (the user id is the PK)."""

    __tablename__ = "user_settings"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), primary_key=True
    )
    language: Mapped[Language] = mapped_column(pg_enum(Language, "language_enum"))
    theme: Mapped[Theme] = mapped_column(pg_enum(Theme, "theme_enum"))

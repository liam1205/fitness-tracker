from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, false, func, true
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    # "user" is a reserved word in PostgreSQL; SQLAlchemy quotes it automatically.
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    first_name: Mapped[str] = mapped_column(String(100), server_default="")
    last_name: Mapped[str] = mapped_column(String(100), server_default="")
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=true(), default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, server_default=false(), default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

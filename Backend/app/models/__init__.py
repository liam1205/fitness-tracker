# Import models here so they register on Base.metadata for Alembic autogenerate.
from app.models.user import User

__all__ = ["User"]

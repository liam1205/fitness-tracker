# Import models here so they register on Base.metadata for Alembic autogenerate.
from app.models.exercise import Exercise
from app.models.user import User
from app.models.user_settings import UserSettings
from app.models.workout_session import SessionExercise, SessionSet, WorkoutSession
from app.models.workout_template import TemplateExercise, WorkoutTemplate

__all__ = [
    "Exercise",
    "SessionExercise",
    "SessionSet",
    "TemplateExercise",
    "User",
    "UserSettings",
    "WorkoutSession",
    "WorkoutTemplate",
]

from fastapi import APIRouter

from app.api.routes import (
    auth,
    exercises,
    health,
    user_settings,
    users,
    workout_sessions,
    workout_templates,
)

# Aggregates all versioned API routes under a single router.
api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(exercises.router)
api_router.include_router(user_settings.router)
api_router.include_router(workout_templates.router)
api_router.include_router(workout_sessions.router)

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Service health status."""

    status: str = Field(..., description="Overall service status.", examples=["ok"])
    environment: str = Field(..., description="Active environment name.", examples=["development"])
    version: str = Field(..., description="API version.", examples=["0.1.0"])

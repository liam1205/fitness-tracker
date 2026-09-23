from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """A single page of results from a paginated list endpoint."""

    items: list[T] = Field(..., description="The items on this page.")
    total: int = Field(..., description="Total number of items across all pages.")
    page: int = Field(..., description="Current page number (1-indexed).", examples=[1])
    page_size: int = Field(..., description="Maximum number of items per page.", examples=[20])
    pages: int = Field(..., description="Total number of pages.")

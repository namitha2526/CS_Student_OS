from datetime import datetime

from pydantic import BaseModel, Field


class LearningResourceBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    url: str | None = None
    resource_type: str = "article"
    category: str = "General"
    notes: str | None = None
    bookmarked: bool = False


class LearningResourceCreate(LearningResourceBase):
    pass


class LearningResourceUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    url: str | None = None
    resource_type: str | None = None
    category: str | None = None
    notes: str | None = None
    bookmarked: bool | None = None


class LearningResourceOut(LearningResourceBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

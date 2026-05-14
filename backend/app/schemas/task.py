from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    priority: str = "medium"
    category: str | None = None
    status: str = "pending"
    estimated_time: int | None = None
    completed: bool = False
    completed_at: datetime | None = None
    tags: list[Any] | None = None
    recurrence: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    deadline: datetime | None = None
    priority: str | None = None
    category: str | None = None
    status: str | None = None
    estimated_time: int | None = None
    completed: bool | None = None
    completed_at: datetime | None = None
    tags: list[Any] | None = None
    recurrence: str | None = None


class TaskOut(TaskBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

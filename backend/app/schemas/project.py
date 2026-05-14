from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    project_name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    github_link: str | None = None
    deployment_link: str | None = None
    tech_stack: list[Any] | None = None
    progress: int = Field(ge=0, le=100, default=0)
    status: str = "idea"
    deadline: datetime | None = None
    notes: str | None = None
    attachments_meta: list[Any] | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    github_link: str | None = None
    deployment_link: str | None = None
    tech_stack: list[Any] | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    status: str | None = None
    deadline: datetime | None = None
    notes: str | None = None
    attachments_meta: list[Any] | None = None


class ProjectOut(ProjectBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

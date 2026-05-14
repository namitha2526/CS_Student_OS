from datetime import datetime

from pydantic import BaseModel, Field


class DSAProblemBase(BaseModel):
    problem_name: str = Field(min_length=1, max_length=255)
    platform: str = "LeetCode"
    topic: str = "Arrays"
    difficulty: str = "Medium"
    status: str = "planned"
    revision_date: datetime | None = None
    notes: str | None = None
    link: str | None = None
    bookmarked: bool = False
    solved_at: datetime | None = None


class DSAProblemCreate(DSAProblemBase):
    pass


class DSAProblemUpdate(BaseModel):
    problem_name: str | None = Field(default=None, min_length=1, max_length=255)
    platform: str | None = None
    topic: str | None = None
    difficulty: str | None = None
    status: str | None = None
    revision_date: datetime | None = None
    notes: str | None = None
    link: str | None = None
    bookmarked: bool | None = None
    solved_at: datetime | None = None


class DSAProblemOut(DSAProblemBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

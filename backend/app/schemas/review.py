from datetime import date, datetime

from pydantic import BaseModel, Field


class WeeklyReviewBase(BaseModel):
    week_start: date
    wins: str | None = None
    losses: str | None = None
    reflection: str | None = None
    goals_completion_rate: int = Field(ge=0, le=100, default=0)
    auto_summary: str | None = None


class WeeklyReviewCreate(WeeklyReviewBase):
    pass


class WeeklyReviewUpdate(BaseModel):
    wins: str | None = None
    losses: str | None = None
    reflection: str | None = None
    goals_completion_rate: int | None = Field(default=None, ge=0, le=100)
    auto_summary: str | None = None


class WeeklyReviewOut(WeeklyReviewBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

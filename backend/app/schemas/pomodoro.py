from datetime import datetime

from pydantic import BaseModel, Field


class PomodoroSessionCreate(BaseModel):
    mode: str = Field(min_length=4, max_length=32)
    duration_seconds: int = Field(ge=1, le=86400)


class PomodoroSessionOut(BaseModel):
    id: int
    user_id: int
    mode: str
    duration_seconds: int
    completed_at: datetime

    model_config = {"from_attributes": True}

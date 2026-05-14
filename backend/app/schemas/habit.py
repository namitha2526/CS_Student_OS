from datetime import date, datetime

from pydantic import BaseModel, Field


class HabitBase(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    category: str = "general"
    color: str = "#6366f1"


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=128)
    category: str | None = None
    color: str | None = None


class HabitOut(HabitBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitCompletionIn(BaseModel):
    day: date
    completed: bool = True


class HabitCompletionOut(BaseModel):
    id: int
    habit_id: int
    day: date
    completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class HabitWithStreak(HabitOut):
    current_streak: int = 0
    completion_rate_30d: float = 0.0

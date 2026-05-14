from pydantic import BaseModel


class ChartPoint(BaseModel):
    label: str
    value: float


class DashboardSummary(BaseModel):
    quote: str
    productivity_streak_days: int
    study_hours_week: float
    tasks_completed_week: int
    dsa_solved_total: int
    dsa_solved_percent: float
    applications_by_status: dict[str, int]
    upcoming_deadlines: list[dict]
    active_projects: list[dict]
    weekly_consistency: list[ChartPoint]
    today_tasks: list[dict]

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.dsa import DSAProblem
from app.models.habit import Habit, HabitCompletion
from app.models.job import JobApplication
from app.models.pomodoro import PomodoroSession
from app.models.task import Task
from app.models.user import User
from app.schemas.analytics import DashboardSummary
from app.services.analytics_service import dashboard_bundle

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> dict:
    data = dashboard_bundle(db, current.id)
    return DashboardSummary.model_validate(data)


@router.get("/trends/tasks")
def task_trends(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[dict]:
    now = datetime.now(timezone.utc)
    points: list[dict] = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        c = int(
            db.scalar(
                select(func.count()).where(
                    Task.user_id == current.id,
                    Task.completed.is_(True),
                    Task.completed_at.isnot(None),
                    Task.completed_at >= start,
                    Task.completed_at < end,
                )
            )
            or 0
        )
        points.append({"label": start.strftime("%a"), "completed": c})
    return points


@router.get("/trends/dsa-topics")
def dsa_topic_breakdown(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[dict]:
    rows = db.execute(
        select(DSAProblem.topic, func.count())
        .where(DSAProblem.user_id == current.id)
        .group_by(DSAProblem.topic)
    ).all()
    return [{"topic": str(r[0]), "count": int(r[1])} for r in rows]


@router.get("/trends/habits")
def habit_trends(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[dict]:
    now = datetime.now(timezone.utc).date()
    start = now - timedelta(days=27)
    q = (
        select(HabitCompletion.day, func.count())
        .join(Habit, Habit.id == HabitCompletion.habit_id)
        .where(
            Habit.user_id == current.id,
            HabitCompletion.day >= start,
            HabitCompletion.completed.is_(True),
        )
        .group_by(HabitCompletion.day)
        .order_by(HabitCompletion.day.asc())
    )
    rows = db.execute(q).all()
    return [{"day": r[0].isoformat(), "count": int(r[1])} for r in rows]


@router.get("/trends/applications")
def application_funnel(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[dict]:
    rows = db.execute(
        select(JobApplication.status, func.count())
        .where(JobApplication.user_id == current.id)
        .group_by(JobApplication.status)
    ).all()
    return [{"status": str(r[0]), "count": int(r[1])} for r in rows]


@router.get("/trends/focus")
def focus_trends(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[dict]:
    now = datetime.now(timezone.utc)
    points: list[dict] = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date()
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        seconds = int(
            db.scalar(
                select(func.coalesce(func.sum(PomodoroSession.duration_seconds), 0)).where(
                    PomodoroSession.user_id == current.id,
                    PomodoroSession.mode == "focus",
                    PomodoroSession.completed_at >= start,
                    PomodoroSession.completed_at < end,
                )
            )
            or 0
        )
        points.append({"label": start.strftime("%a"), "minutes": round(seconds / 60, 1)})
    return points

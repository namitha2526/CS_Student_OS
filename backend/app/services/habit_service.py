from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.habit import HabitCompletion


def habit_current_streak(db: Session, habit_id: int) -> int:
    rows = list(
        db.scalars(
            select(HabitCompletion.day)
            .where(HabitCompletion.habit_id == habit_id, HabitCompletion.completed.is_(True))
            .order_by(HabitCompletion.day.desc())
        ).all()
    )
    if not rows:
        return 0
    day_set = set(rows)
    today = date.today()
    anchor = today if today in day_set else (today - timedelta(days=1) if (today - timedelta(days=1)) in day_set else None)
    if anchor is None:
        return 0
    streak = 0
    d = anchor
    while d in day_set:
        streak += 1
        d -= timedelta(days=1)
    return streak


def habit_completion_rate_30d(db: Session, habit_id: int) -> float:
    end = date.today()
    start = end - timedelta(days=29)
    total = 30
    done = int(
        db.scalar(
            select(func.count())
            .select_from(HabitCompletion)
            .where(
                HabitCompletion.habit_id == habit_id,
                HabitCompletion.completed.is_(True),
                HabitCompletion.day >= start,
                HabitCompletion.day <= end,
            )
        )
        or 0
    )
    return round((done / total) * 100, 1)

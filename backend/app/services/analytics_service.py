from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.dsa import DSAProblem
from app.models.job import JobApplication
from app.models.pomodoro import PomodoroSession
from app.models.project import Project
from app.models.task import Task

MOTIVATION_QUOTES: list[str] = [
    "Ship small, iterate fast, sleep enough.",
    "Consistency beats intensity. One problem a day compounds.",
    "Your future self is watching the repos you push today.",
    "Focus is a skill — train it like DSA.",
    "Interviews reward clarity. Practice explaining, not just coding.",
]


def productivity_streak(db: Session, user_id: int) -> int:
    """Consecutive days with at least one completed focus session (including today)."""
    today = datetime.now(timezone.utc).date()
    streak = 0
    for i in range(0, 400):
        day = today - timedelta(days=i)
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        q = (
            select(func.count())
            .select_from(PomodoroSession)
            .where(
                PomodoroSession.user_id == user_id,
                PomodoroSession.mode == "focus",
                PomodoroSession.completed_at >= start,
                PomodoroSession.completed_at < end,
            )
        )
        count = int(db.scalar(q) or 0)
        if count > 0:
            streak += 1
        else:
            break
    return streak


def study_hours_week(db: Session, user_id: int) -> float:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)
    q = select(func.coalesce(func.sum(PomodoroSession.duration_seconds), 0)).where(
        PomodoroSession.user_id == user_id,
        PomodoroSession.mode == "focus",
        PomodoroSession.completed_at >= start,
    )
    seconds = int(db.scalar(q) or 0)
    return round(seconds / 3600, 2)


def tasks_completed_week(db: Session, user_id: int) -> int:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)
    q = select(func.count()).where(
        Task.user_id == user_id,
        Task.completed.is_(True),
        Task.completed_at.isnot(None),
        Task.completed_at >= start,
    )
    return int(db.scalar(q) or 0)


def dsa_stats(db: Session, user_id: int) -> tuple[int, float]:
    total = int(
        db.scalar(select(func.count()).select_from(DSAProblem).where(DSAProblem.user_id == user_id)) or 0
    )
    solved = int(
        db.scalar(
            select(func.count()).select_from(DSAProblem).where(
                DSAProblem.user_id == user_id, DSAProblem.status == "solved"
            )
        )
        or 0
    )
    pct = round((solved / total) * 100, 1) if total else 0.0
    return solved, pct


def applications_by_status(db: Session, user_id: int) -> dict[str, int]:
    rows = db.execute(
        select(JobApplication.status, func.count())
        .where(JobApplication.user_id == user_id)
        .group_by(JobApplication.status)
    ).all()
    return {str(r[0]): int(r[1]) for r in rows}


def upcoming_deadlines(db: Session, user_id: int, limit: int = 8) -> list[dict[str, Any]]:
    tasks = db.scalars(
        select(Task)
        .where(Task.user_id == user_id, Task.deadline.isnot(None), Task.completed.is_(False))
        .order_by(Task.deadline.asc())
        .limit(limit)
    ).all()
    projects = db.scalars(
        select(Project)
        .where(Project.user_id == user_id, Project.deadline.isnot(None), Project.status != "shipped")
        .order_by(Project.deadline.asc())
        .limit(limit)
    ).all()
    items: list[dict[str, Any]] = []
    for t in tasks:
        items.append({"type": "task", "title": t.title, "deadline": t.deadline.isoformat() if t.deadline else None})
    for p in projects:
        items.append(
            {
                "type": "project",
                "title": p.project_name,
                "deadline": p.deadline.isoformat() if p.deadline else None,
            }
        )
    items.sort(key=lambda x: x["deadline"] or "9999")
    return items[:limit]


def active_projects(db: Session, user_id: int, limit: int = 5) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Project)
        .where(Project.user_id == user_id, Project.status.in_(["idea", "active", "paused"]))
        .order_by(Project.created_at.desc())
        .limit(limit)
    ).all()
    return [{"id": p.id, "name": p.project_name, "progress": p.progress, "status": p.status} for p in rows]


def weekly_consistency(db: Session, user_id: int) -> list[dict[str, Any]]:
    """Focus minutes per day for the last 7 days."""
    today = datetime.now(timezone.utc).date()
    points: list[dict[str, Any]] = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        seconds = int(
            db.scalar(
                select(func.coalesce(func.sum(PomodoroSession.duration_seconds), 0)).where(
                    PomodoroSession.user_id == user_id,
                    PomodoroSession.mode == "focus",
                    PomodoroSession.completed_at >= start,
                    PomodoroSession.completed_at < end,
                )
            )
            or 0
        )
        label = day.strftime("%a")
        points.append({"label": label, "value": round(seconds / 60, 1)})
    return points


def today_tasks(db: Session, user_id: int, limit: int = 8) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Task)
        .where(Task.user_id == user_id, Task.completed.is_(False))
        .order_by(Task.priority.desc(), Task.deadline.is_(None), Task.deadline.asc(), Task.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "deadline": t.deadline.isoformat() if t.deadline else None,
        }
        for t in rows
    ]


def dashboard_bundle(db: Session, user_id: int) -> dict[str, Any]:
    solved, dsa_pct = dsa_stats(db, user_id)
    quote = random.choice(MOTIVATION_QUOTES)
    return {
        "quote": quote,
        "productivity_streak_days": productivity_streak(db, user_id),
        "study_hours_week": study_hours_week(db, user_id),
        "tasks_completed_week": tasks_completed_week(db, user_id),
        "dsa_solved_total": solved,
        "dsa_solved_percent": dsa_pct,
        "applications_by_status": applications_by_status(db, user_id),
        "upcoming_deadlines": upcoming_deadlines(db, user_id),
        "active_projects": active_projects(db, user_id),
        "weekly_consistency": weekly_consistency(db, user_id),
        "today_tasks": today_tasks(db, user_id),
    }

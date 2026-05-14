"""User data export/import for local backup and migration."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.dsa import DSAProblem
from app.models.habit import Habit, HabitCompletion
from app.models.job import JobApplication
from app.models.pomodoro import PomodoroSession
from app.models.project import Project
from app.models.resource import LearningResource
from app.models.review import WeeklyReview
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/settings/data", tags=["settings"])


def _serialize_model(obj: Any) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        if isinstance(val, datetime):
            data[c.name] = val.isoformat()
        elif isinstance(val, date):
            data[c.name] = val.isoformat()
        else:
            data[c.name] = val
    return data


@router.get("/export")
def export_all(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> dict[str, Any]:
    uid = current.id
    habits = list(db.scalars(select(Habit).where(Habit.user_id == uid)).all())
    habit_ids = [h.id for h in habits]
    completions: list[HabitCompletion] = []
    if habit_ids:
        completions = list(db.scalars(select(HabitCompletion).where(HabitCompletion.habit_id.in_(habit_ids))).all())
    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {"username": current.username, "email": current.email, "preferences": current.preferences},
        "tasks": [_serialize_model(t) for t in db.scalars(select(Task).where(Task.user_id == uid)).all()],
        "dsa_problems": [_serialize_model(x) for x in db.scalars(select(DSAProblem).where(DSAProblem.user_id == uid)).all()],
        "applications": [_serialize_model(x) for x in db.scalars(select(JobApplication).where(JobApplication.user_id == uid)).all()],
        "projects": [_serialize_model(x) for x in db.scalars(select(Project).where(Project.user_id == uid)).all()],
        "pomodoro_sessions": [_serialize_model(x) for x in db.scalars(select(PomodoroSession).where(PomodoroSession.user_id == uid)).all()],
        "habits": [_serialize_model(x) for x in habits],
        "habit_completions": [_serialize_model(x) for x in completions],
        "resources": [_serialize_model(x) for x in db.scalars(select(LearningResource).where(LearningResource.user_id == uid)).all()],
        "weekly_reviews": [_serialize_model(x) for x in db.scalars(select(WeeklyReview).where(WeeklyReview.user_id == uid)).all()],
    }


class ImportPayload(BaseModel):
    data: dict[str, Any]


def _parse_dt(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return date.fromisoformat(str(value)[:10])


@router.post("/import")
def import_all(
    body: ImportPayload,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict[str, str]:
    payload = body.data
    if int(payload.get("version", 0)) != 1:
        raise HTTPException(status_code=400, detail="Unsupported export version")

    uid = current.id
    db.execute(delete(PomodoroSession).where(PomodoroSession.user_id == uid))
    db.execute(delete(Task).where(Task.user_id == uid))
    db.execute(delete(DSAProblem).where(DSAProblem.user_id == uid))
    db.execute(delete(JobApplication).where(JobApplication.user_id == uid))
    db.execute(delete(Project).where(Project.user_id == uid))
    db.execute(delete(LearningResource).where(LearningResource.user_id == uid))
    db.execute(delete(WeeklyReview).where(WeeklyReview.user_id == uid))
    db.execute(delete(Habit).where(Habit.user_id == uid))
    db.commit()

    prefs = (payload.get("user") or {}).get("preferences")
    if isinstance(prefs, dict):
        current.preferences = prefs
        db.add(current)

    habits_map: dict[int, int] = {}

    def imp_tasks(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["deadline"] = _parse_dt(r.get("deadline"))
            r["completed_at"] = _parse_dt(r.get("completed_at"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(Task(user_id=uid, **r))

    def imp_dsa(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["revision_date"] = _parse_dt(r.get("revision_date"))
            r["solved_at"] = _parse_dt(r.get("solved_at"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(DSAProblem(user_id=uid, **r))

    def imp_jobs(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["applied_date"] = _parse_date(r.get("applied_date"))
            r["follow_up_date"] = _parse_date(r.get("follow_up_date"))
            r["interview_date"] = _parse_dt(r.get("interview_date"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(JobApplication(user_id=uid, **r))

    def imp_projects(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["deadline"] = _parse_dt(r.get("deadline"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(Project(user_id=uid, **r))

    def imp_pomodoro(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["completed_at"] = _parse_dt(r.get("completed_at")) or datetime.now(timezone.utc)
            db.add(PomodoroSession(user_id=uid, **r))

    def imp_habits(rows: list[dict]) -> None:
        for r in rows:
            old_id = r.get("id")
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            h = Habit(user_id=uid, **r)
            db.add(h)
            db.flush()
            if old_id is not None:
                habits_map[int(old_id)] = int(h.id)

    def imp_habit_completions(rows: list[dict]) -> None:
        for r in rows:
            hid = r.get("habit_id")
            if hid is None:
                continue
            new_hid = habits_map.get(int(hid))
            if new_hid is None:
                continue
            r = {k: v for k, v in r.items() if k not in ("id",)}
            r["habit_id"] = new_hid
            r["day"] = _parse_date(r.get("day"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(HabitCompletion(**r))

    def imp_resources(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(LearningResource(user_id=uid, **r))

    def imp_reviews(rows: list[dict]) -> None:
        for r in rows:
            r = {k: v for k, v in r.items() if k not in ("id", "user_id")}
            r["week_start"] = _parse_date(r.get("week_start"))
            r["created_at"] = _parse_dt(r.get("created_at")) or datetime.now(timezone.utc)
            db.add(WeeklyReview(user_id=uid, **r))

    imp_tasks(list(payload.get("tasks") or []))
    imp_dsa(list(payload.get("dsa_problems") or []))
    imp_jobs(list(payload.get("applications") or []))
    imp_projects(list(payload.get("projects") or []))
    imp_pomodoro(list(payload.get("pomodoro_sessions") or []))
    imp_habits(list(payload.get("habits") or []))
    imp_habit_completions(list(payload.get("habit_completions") or []))
    imp_resources(list(payload.get("resources") or []))
    imp_reviews(list(payload.get("weekly_reviews") or []))

    db.commit()
    return {"status": "ok"}


@router.get("/backup-note")
def backup_note() -> dict[str, str]:
    return {
        "message": "The SQLite file lives beside the backend process (see DATABASE_URL). "
        "Copy student_os.db for a cold backup, or use export/import from the UI."
    }

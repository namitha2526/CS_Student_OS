from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.pomodoro import PomodoroSession
from app.models.user import User
from app.schemas.pomodoro import PomodoroSessionCreate, PomodoroSessionOut

router = APIRouter(prefix="/pomodoro", tags=["pomodoro"])

ALLOWED_MODES = {"focus", "short_break", "long_break"}


@router.post("/sessions", response_model=PomodoroSessionOut)
def log_session(
    body: PomodoroSessionCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> PomodoroSession:
    if body.mode not in ALLOWED_MODES:
        raise HTTPException(status_code=400, detail="Invalid mode")
    row = PomodoroSession(user_id=current.id, mode=body.mode, duration_seconds=body.duration_seconds)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/sessions", response_model=list[PomodoroSessionOut])
def list_sessions(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(500, ge=1, le=2000),
) -> list[PomodoroSession]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    stmt = (
        select(PomodoroSession)
        .where(PomodoroSession.user_id == current.id, PomodoroSession.completed_at >= since)
        .order_by(PomodoroSession.completed_at.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


@router.get("/stats/summary")
def pomodoro_summary(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> dict:
    now = datetime.now(timezone.utc)
    week_start = now - timedelta(days=7)
    focus_seconds = int(
        db.scalar(
            select(func.coalesce(func.sum(PomodoroSession.duration_seconds), 0)).where(
                PomodoroSession.user_id == current.id,
                PomodoroSession.mode == "focus",
                PomodoroSession.completed_at >= week_start,
            )
        )
        or 0
    )
    sessions_count = int(
        db.scalar(
            select(func.count()).where(
                PomodoroSession.user_id == current.id,
                PomodoroSession.mode == "focus",
                PomodoroSession.completed_at >= week_start,
            )
        )
        or 0
    )
    return {
        "focus_minutes_week": round(focus_seconds / 60, 1),
        "focus_sessions_week": sessions_count,
    }

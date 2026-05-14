from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.habit import Habit, HabitCompletion
from app.models.user import User
from app.schemas.habit import (
    HabitCompletionIn,
    HabitCompletionOut,
    HabitCreate,
    HabitOut,
    HabitUpdate,
    HabitWithStreak,
)
from app.services.habit_service import habit_completion_rate_30d, habit_current_streak

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=list[HabitWithStreak])
def list_habits(db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> list[HabitWithStreak]:
    habits = list(db.scalars(select(Habit).where(Habit.user_id == current.id).order_by(Habit.created_at.asc())).all())
    out: list[HabitWithStreak] = []
    for h in habits:
        base = HabitOut.model_validate(h).model_dump()
        base["current_streak"] = habit_current_streak(db, h.id)
        base["completion_rate_30d"] = habit_completion_rate_30d(db, h.id)
        out.append(HabitWithStreak(**base))
    return out


@router.post("", response_model=HabitOut)
def create_habit(body: HabitCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> Habit:
    row = Habit(user_id=current.id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{hid}", response_model=HabitOut)
def update_habit(
    hid: int, body: HabitUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> Habit:
    row = db.get(Habit, hid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Habit not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{hid}", status_code=204)
def delete_habit(hid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(Habit, hid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(row)
    db.commit()


@router.post("/{hid}/completions", response_model=HabitCompletionOut)
def upsert_completion(
    hid: int,
    body: HabitCompletionIn,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> HabitCompletion:
    habit = db.get(Habit, hid)
    if habit is None or habit.user_id != current.id:
        raise HTTPException(status_code=404, detail="Habit not found")
    existing = db.scalar(
        select(HabitCompletion).where(HabitCompletion.habit_id == hid, HabitCompletion.day == body.day)
    )
    if existing:
        existing.completed = body.completed
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    row = HabitCompletion(habit_id=hid, day=body.day, completed=body.completed)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{hid}/heatmap", response_model=list[HabitCompletionOut])
def habit_heatmap(
    hid: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    days: int = Query(120, ge=7, le=400),
) -> list[HabitCompletion]:
    habit = db.get(Habit, hid)
    if habit is None or habit.user_id != current.id:
        raise HTTPException(status_code=404, detail="Habit not found")
    start = date.today() - timedelta(days=days)
    rows = list(
        db.scalars(
            select(HabitCompletion)
            .where(HabitCompletion.habit_id == hid, HabitCompletion.day >= start)
            .order_by(HabitCompletion.day.asc())
        ).all()
    )
    return rows

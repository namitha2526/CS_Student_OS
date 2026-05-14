from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.review import WeeklyReview
from app.models.user import User
from app.schemas.review import WeeklyReviewCreate, WeeklyReviewOut, WeeklyReviewUpdate

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=list[WeeklyReviewOut])
def list_reviews(
    db: Session = Depends(get_db), current: User = Depends(get_current_user), limit: int = Query(52, ge=1, le=104)
) -> list[WeeklyReview]:
    stmt = (
        select(WeeklyReview)
        .where(WeeklyReview.user_id == current.id)
        .order_by(WeeklyReview.week_start.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


@router.post("", response_model=WeeklyReviewOut)
def upsert_review(
    body: WeeklyReviewCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> WeeklyReview:
    existing = db.scalar(
        select(WeeklyReview).where(WeeklyReview.user_id == current.id, WeeklyReview.week_start == body.week_start)
    )
    if existing:
        for k, v in body.model_dump().items():
            if k != "week_start":
                setattr(existing, k, v)
        if existing.auto_summary is None:
            existing.auto_summary = "Auto-generated summaries will appear here in a future AI module."
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return existing
    row = WeeklyReview(user_id=current.id, **body.model_dump())
    if row.auto_summary is None:
        row.auto_summary = "Auto-generated summaries will appear here in a future AI module."
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{rid}", response_model=WeeklyReviewOut)
def update_review(
    rid: int, body: WeeklyReviewUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> WeeklyReview:
    row = db.get(WeeklyReview, rid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Review not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{rid}", status_code=204)
def delete_review(rid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(WeeklyReview, rid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Review not found")
    db.delete(row)
    db.commit()

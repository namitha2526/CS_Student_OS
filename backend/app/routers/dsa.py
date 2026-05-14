from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.dsa import DSAProblem
from app.models.user import User
from app.schemas.dsa import DSAProblemCreate, DSAProblemOut, DSAProblemUpdate

router = APIRouter(prefix="/dsa", tags=["dsa"])


@router.get("", response_model=list[DSAProblemOut])
def list_problems(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    topic: str | None = None,
    difficulty: str | None = None,
    status: str | None = None,
    bookmarked: bool | None = None,
    q: str | None = None,
    limit: int = Query(300, ge=1, le=500),
) -> list[DSAProblem]:
    stmt = select(DSAProblem).where(DSAProblem.user_id == current.id)
    if topic:
        stmt = stmt.where(DSAProblem.topic == topic)
    if difficulty:
        stmt = stmt.where(DSAProblem.difficulty == difficulty)
    if status:
        stmt = stmt.where(DSAProblem.status == status)
    if bookmarked is not None:
        stmt = stmt.where(DSAProblem.bookmarked == bookmarked)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(DSAProblem.problem_name.ilike(like), DSAProblem.notes.ilike(like)))
    stmt = stmt.order_by(DSAProblem.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=DSAProblemOut)
def create_problem(
    body: DSAProblemCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> DSAProblem:
    row = DSAProblem(user_id=current.id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{pid}", response_model=DSAProblemOut)
def update_problem(
    pid: int, body: DSAProblemUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> DSAProblem:
    row = db.get(DSAProblem, pid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{pid}", status_code=204)
def delete_problem(pid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(DSAProblem, pid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Problem not found")
    db.delete(row)
    db.commit()

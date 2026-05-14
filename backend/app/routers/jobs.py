from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.job import JobApplication
from app.models.user import User
from app.schemas.job import JobApplicationCreate, JobApplicationOut, JobApplicationUpdate

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[JobApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    status: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=500),
) -> list[JobApplication]:
    stmt = select(JobApplication).where(JobApplication.user_id == current.id)
    if status:
        stmt = stmt.where(JobApplication.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(JobApplication.company.ilike(like), JobApplication.role.ilike(like)))
    stmt = stmt.order_by(JobApplication.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=JobApplicationOut)
def create_application(
    body: JobApplicationCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> JobApplication:
    row = JobApplication(user_id=current.id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{aid}", response_model=JobApplicationOut)
def update_application(
    aid: int, body: JobApplicationUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> JobApplication:
    row = db.get(JobApplication, aid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Application not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{aid}", status_code=204)
def delete_application(aid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(JobApplication, aid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(row)
    db.commit()

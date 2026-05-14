from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.resource import LearningResource
from app.models.user import User
from app.schemas.resource import LearningResourceCreate, LearningResourceOut, LearningResourceUpdate

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=list[LearningResourceOut])
def list_resources(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    resource_type: str | None = None,
    category: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=500),
) -> list[LearningResource]:
    stmt = select(LearningResource).where(LearningResource.user_id == current.id)
    if resource_type:
        stmt = stmt.where(LearningResource.resource_type == resource_type)
    if category:
        stmt = stmt.where(LearningResource.category == category)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(LearningResource.title.ilike(like), LearningResource.notes.ilike(like), LearningResource.url.ilike(like))
        )
    stmt = stmt.order_by(LearningResource.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=LearningResourceOut)
def create_resource(
    body: LearningResourceCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> LearningResource:
    row = LearningResource(user_id=current.id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{rid}", response_model=LearningResourceOut)
def update_resource(
    rid: int, body: LearningResourceUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> LearningResource:
    row = db.get(LearningResource, rid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Resource not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{rid}", status_code=204)
def delete_resource(rid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(LearningResource, rid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Resource not found")
    db.delete(row)
    db.commit()

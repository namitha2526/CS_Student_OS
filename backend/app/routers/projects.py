from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    status: str | None = None,
    q: str | None = None,
    limit: int = Query(100, ge=1, le=200),
) -> list[Project]:
    stmt = select(Project).where(Project.user_id == current.id)
    if status:
        stmt = stmt.where(Project.status == status)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Project.project_name.ilike(like), Project.description.ilike(like)))
    stmt = stmt.order_by(Project.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=ProjectOut)
def create_project(
    body: ProjectCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> Project:
    row = Project(user_id=current.id, **body.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{pid}", response_model=ProjectOut)
def update_project(
    pid: int, body: ProjectUpdate, db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> Project:
    row = db.get(Project, pid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Project not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{pid}", status_code=204)
def delete_project(pid: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    row = db.get(Project, pid)
    if row is None or row.user_id != current.id:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(row)
    db.commit()

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
def list_tasks(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    status: str | None = None,
    priority: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=500),
) -> list[Task]:
    stmt = select(Task).where(Task.user_id == current.id)
    if status:
        stmt = stmt.where(Task.status == status)
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Task.title.ilike(like), Task.description.ilike(like)))
    stmt = stmt.order_by(Task.created_at.desc()).limit(limit)
    return list(db.scalars(stmt).all())


@router.post("", response_model=TaskOut)
def create_task(body: TaskCreate, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> Task:
    data = body.model_dump()
    if data.get("completed") or data.get("status") == "completed":
        data["completed"] = True
        data["status"] = "completed"
        data["completed_at"] = data.get("completed_at") or datetime.now(timezone.utc)
    task = Task(user_id=current.id, **data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.user_id != current.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.user_id != current.id:
        raise HTTPException(status_code=404, detail="Task not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    if task.status == "completed" or task.completed:
        task.completed = True
        task.status = "completed"
        task.completed_at = task.completed_at or datetime.now(timezone.utc)
    else:
        task.completed = False
        task.completed_at = None
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current: User = Depends(get_current_user)) -> None:
    task = db.get(Task, task_id)
    if task is None or task.user_id != current.id:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()

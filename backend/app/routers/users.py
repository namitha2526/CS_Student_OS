from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.security import get_password_hash, verify_password
from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import ProfileUpdate, UserOut, UserPreferences

router = APIRouter(prefix="/users", tags=["users"])


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


@router.get("/me", response_model=UserOut)
def read_me(current: User = Depends(get_current_user)) -> User:
    return current


@router.patch("/me/preferences", response_model=UserOut)
def update_preferences(
    prefs: UserPreferences,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> User:
    data = current.preferences or {}
    if prefs.theme is not None:
        data["theme"] = prefs.theme
    if prefs.notifications is not None:
        data["notifications"] = prefs.notifications
    if prefs.dashboard_order is not None:
        data["dashboard_order"] = prefs.dashboard_order
    current.preferences = data
    db.add(current)
    db.commit()
    db.refresh(current)
    return current


@router.patch("/me/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> User:
    if body.email and body.email != current.email:
        if db.scalar(select(User).where(User.email == body.email)):
            raise HTTPException(status_code=400, detail="Email already in use")
        current.email = str(body.email)
    if body.username and body.username != current.username:
        if db.scalar(select(User).where(User.username == body.username)):
            raise HTTPException(status_code=400, detail="Username already in use")
        current.username = body.username
    db.add(current)
    db.commit()
    db.refresh(current)
    return current


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    body: PasswordChange,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> None:
    if not verify_password(body.current_password, current.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current.password_hash = get_password_hash(body.new_password)
    db.add(current)
    db.commit()

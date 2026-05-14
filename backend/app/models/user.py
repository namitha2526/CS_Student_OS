from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.dsa import DSAProblem
    from app.models.habit import Habit
    from app.models.job import JobApplication
    from app.models.project import Project
    from app.models.pomodoro import PomodoroSession
    from app.models.resource import LearningResource
    from app.models.review import WeeklyReview
    from app.models.task import Task


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    # theme, notifications, dashboard card order, etc.
    preferences: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    tasks: Mapped[list[Task]] = relationship(back_populates="user", cascade="all, delete-orphan")
    dsa_problems: Mapped[list[DSAProblem]] = relationship(back_populates="user", cascade="all, delete-orphan")
    applications: Mapped[list[JobApplication]] = relationship(back_populates="user", cascade="all, delete-orphan")
    projects: Mapped[list[Project]] = relationship(back_populates="user", cascade="all, delete-orphan")
    pomodoro_sessions: Mapped[list[PomodoroSession]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    habits: Mapped[list[Habit]] = relationship(back_populates="user", cascade="all, delete-orphan")
    resources: Mapped[list[LearningResource]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weekly_reviews: Mapped[list[WeeklyReview]] = relationship(back_populates="user", cascade="all, delete-orphan")

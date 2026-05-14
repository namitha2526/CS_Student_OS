"""Seed demo data for first-time local setup."""

from __future__ import annotations

import random
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from app.auth.security import get_password_hash
from app.database.session import SessionLocal
from app.models.dsa import DSAProblem
from app.models.habit import Habit, HabitCompletion
from app.models.job import JobApplication
from app.models.pomodoro import PomodoroSession
from app.models.project import Project
from app.models.resource import LearningResource
from app.models.review import WeeklyReview
from app.models.task import Task
from app.models.user import User


def seed_if_empty() -> None:
    db = SessionLocal()
    try:
        if int(db.scalar(select(func.count()).select_from(User)) or 0) > 0:
            return
        _seed(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _seed(db: OrmSession) -> None:
    user = User(
        username="demo",
        email="demo@student.os",
        password_hash=get_password_hash("Password123!"),
        preferences={
            "theme": "dark",
            "notifications": {"email": False, "browser": False},
            "dashboard_order": [
                "welcome",
                "quote",
                "tasks",
                "dsa",
                "consistency",
                "projects",
                "deadlines",
                "apps",
                "streak",
                "focus",
                "study",
                "skills",
            ],
        },
    )
    db.add(user)
    db.flush()

    uid = user.id
    now = datetime.now(timezone.utc)

    tasks = [
        Task(
            user_id=uid,
            title="Finish resume v2",
            description="Quantify impact bullets",
            deadline=now + timedelta(days=2),
            priority="high",
            category="Career",
            status="in_progress",
            estimated_time=90,
            tags=["career", "urgent"],
            recurrence=None,
        ),
        Task(
            user_id=uid,
            title="Revise Graph templates",
            description="BFS/DFS patterns",
            deadline=now + timedelta(days=1),
            priority="urgent",
            category="DSA",
            status="pending",
            estimated_time=120,
            tags=["dsa", "graphs"],
            recurrence="weekly",
        ),
        Task(
            user_id=uid,
            title="Mock interview",
            description="45m system design drill",
            deadline=now + timedelta(days=5),
            priority="medium",
            category="Interview",
            status="pending",
            estimated_time=45,
            tags=["interview"],
            recurrence=None,
        ),
        Task(
            user_id=uid,
            title="Ship portfolio polish",
            description="Animations + lighthouse pass",
            deadline=now - timedelta(days=1),
            priority="medium",
            category="Projects",
            status="missed",
            estimated_time=180,
            tags=["frontend"],
            recurrence=None,
        ),
    ]
    for t in tasks:
        db.add(t)
    db.flush()
    done = Task(
        user_id=uid,
        title="Complete OS dashboard",
        description="Glass cards + charts",
        deadline=now,
        priority="high",
        category="Projects",
        status="completed",
        completed=True,
        completed_at=now - timedelta(days=1),
        estimated_time=240,
        tags=["product"],
        recurrence=None,
    )
    db.add(done)

    dsa_rows = [
        ("Two Sum", "LeetCode", "Arrays", "Easy", "solved", True),
        ("Longest Substring Without Repeating", "LeetCode", "Strings", "Medium", "solved", True),
        ("Binary Tree Maximum Path Sum", "LeetCode", "Trees", "Hard", "revising", False),
        ("Course Schedule", "LeetCode", "Graphs", "Medium", "solving", False),
        ("House Robber II", "LeetCode", "DP", "Medium", "planned", False),
        ("N-Queens", "LeetCode", "Backtracking", "Hard", "planned", False),
        ("Jump Game", "LeetCode", "Greedy", "Medium", "solved", True),
        ("Merge K Sorted Lists", "LeetCode", "Heap", "Hard", "revising", False),
    ]
    for name, plat, topic, diff, st, bm in dsa_rows:
        solved_at = now - timedelta(days=random.randint(1, 20)) if st == "solved" else None
        db.add(
            DSAProblem(
                user_id=uid,
                problem_name=name,
                platform=plat,
                topic=topic,
                difficulty=diff,
                status=st,
                revision_date=now + timedelta(days=7) if st == "revising" else None,
                notes="Pattern notes go here.",
                link="https://leetcode.com",
                bookmarked=bm,
                solved_at=solved_at,
            )
        )

    jobs = [
        ("Acme Labs", "SWE Intern", "Remote", "$45/hr", "applied", date.today() - timedelta(days=5)),
        ("Northwind", "Backend Intern", "Bengaluru", None, "oa", date.today() - timedelta(days=2)),
        ("Contoso", "ML Intern", "Hyderabad", None, "interview", date.today() - timedelta(days=10)),
        ("Fabrikam", "Full Stack", "Remote", None, "wishlist", None),
        ("Globex", "Platform Intern", "Pune", None, "rejected", date.today() - timedelta(days=30)),
    ]
    for company, role, loc, sal, st, applied in jobs:
        db.add(
            JobApplication(
                user_id=uid,
                company=company,
                role=role,
                location=loc,
                salary=sal,
                status=st,
                applied_date=applied,
                interview_date=now + timedelta(days=3) if st == "interview" else None,
                notes="Follow up after OA.",
                job_link="https://example.com",
                resume_version="v3",
                follow_up_date=date.today() + timedelta(days=2) if st in ("applied", "oa") else None,
            )
        )

    projects = [
        ("CS Student OS", "Personal productivity OS", 72, "active"),
        ("Distributed KV (Toy)", "Raft learning project", 35, "active"),
        ("CLI Resume Builder", "Rust + TUI", 10, "idea"),
    ]
    for name, desc, prog, st in projects:
        db.add(
            Project(
                user_id=uid,
                project_name=name,
                description=desc,
                github_link="https://github.com",
                deployment_link="https://vercel.app",
                tech_stack=["React", "FastAPI", "SQLite"],
                progress=prog,
                status=st,
                deadline=now + timedelta(days=14),
                notes="Milestones: auth, charts, polish",
                attachments_meta=[{"name": "screenshot.png", "url": "/placeholder"}],
            )
        )

    for i in range(7):
        day = (now - timedelta(days=i)).date()
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        if random.random() < 0.85:
            mins = random.randint(25, 120)
            db.add(
                PomodoroSession(
                    user_id=uid,
                    mode="focus",
                    duration_seconds=mins * 60,
                    completed_at=start + timedelta(hours=18),
                )
            )

    habits_spec = [
        ("DSA hour", "DSA", "#22d3ee"),
        ("Build in public", "Development", "#a78bfa"),
        ("Workout", "Health", "#34d399"),
        ("Resume touch-ups", "Resume", "#f472b6"),
        ("LinkedIn post", "LinkedIn", "#60a5fa"),
        ("Aptitude drills", "Aptitude", "#fbbf24"),
    ]
    for name, cat, color in habits_spec:
        h = Habit(user_id=uid, name=name, category=cat, color=color)
        db.add(h)
        db.flush()
        for j in range(21):
            d = date.today() - timedelta(days=j)
            if random.random() < 0.65:
                db.add(HabitCompletion(habit_id=h.id, day=d, completed=True))

    resources = [
        ("MIT OCW — Algorithms", "https://ocw.mit.edu", "course", "Algorithms", "# Intro to proofs and recurrences"),
        ("NeetCode roadmap", "https://neetcode.io", "documentation", "DSA", "## Graphs section"),
        ("System Design Primer", "https://github.com/donnemartin/system-design-primer", "documentation", "Interview", ""),
    ]
    for title, url, rtype, cat, notes in resources:
        db.add(
            LearningResource(
                user_id=uid,
                title=title,
                url=url,
                resource_type=rtype,
                category=cat,
                notes=notes,
                bookmarked=True,
            )
        )

    ws = date.today() - timedelta(days=date.today().weekday())
    db.add(
        WeeklyReview(
            user_id=uid,
            week_start=ws,
            wins="Shipped dashboard cards; 3 DSA revisits",
            losses="Missed one mock; sleep debt mid-week",
            reflection="Batch shallow tasks; protect deep work mornings.",
            goals_completion_rate=68,
            auto_summary="Placeholder: weekly AI digest will summarize trends across tasks and focus.",
        )
    )

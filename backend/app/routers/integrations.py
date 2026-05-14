"""Placeholder routes for future AI and external integrations."""

from fastapi import APIRouter

router = APIRouter(prefix="/integrations", tags=["integrations"])


@router.get("/roadmap")
def integration_roadmap() -> dict:
    return {
        "ai_productivity_assistant": {"status": "planned", "notes": "Chat-style coach using local rules + optional API key."},
        "ai_schedule_recommendations": {"status": "planned", "notes": "Suggest blocks from tasks, habits, and focus history."},
        "resume_analyzer": {"status": "planned", "notes": "Parse resume PDF/DOCX and score sections."},
        "interview_prep_ai": {"status": "planned", "notes": "Company/topic drills with rubric feedback."},
        "github_api": {"status": "planned", "notes": "Sync repos, PRs, and contribution heat to projects."},
        "leetcode_api": {"status": "planned", "notes": "Profile sync placeholder — official API constraints apply."},
        "notifications": {"status": "planned", "notes": "Web push / email hooks behind user preferences."},
    }

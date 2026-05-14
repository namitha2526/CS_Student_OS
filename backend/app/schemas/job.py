from datetime import date, datetime

from pydantic import BaseModel, Field


class JobApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=255)
    role: str = Field(min_length=1, max_length=255)
    location: str | None = None
    salary: str | None = None
    status: str = "wishlist"
    applied_date: date | None = None
    interview_date: datetime | None = None
    notes: str | None = None
    job_link: str | None = None
    resume_version: str | None = None
    follow_up_date: date | None = None


class JobApplicationCreate(JobApplicationBase):
    pass


class JobApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=255)
    role: str | None = Field(default=None, min_length=1, max_length=255)
    location: str | None = None
    salary: str | None = None
    status: str | None = None
    applied_date: date | None = None
    interview_date: datetime | None = None
    notes: str | None = None
    job_link: str | None = None
    resume_version: str | None = None
    follow_up_date: date | None = None


class JobApplicationOut(JobApplicationBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

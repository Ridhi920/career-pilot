from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from app.models.job import JobStatus


class DiscoverRequest(BaseModel):
    query: str = Field(..., min_length=2)
    location: str = Field(default="India")
    sources: list[str] = Field(default=["linkedin", "naukri"])
    num_jobs: int = Field(default=20, ge=1, le=50)
    resume_id: Optional[int] = None        # if provided, auto-score after discovery


class JobMatchData(BaseModel):
    score: float
    matching_skills: list[str] = []
    missing_skills: list[str] = []
    recommendation: str                    # apply | maybe | skip
    reason: str = ""


class JobListingResponse(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    url: str
    source: str
    is_easy_apply: bool
    match_score: Optional[float] = None
    match_data: Optional[JobMatchData] = None
    cover_letter: Optional[str] = None
    tailored_resume: Optional[str] = None
    status: str
    resume_id: Optional[int] = None
    posted_at: Optional[datetime] = None
    applied_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ScoreJobRequest(BaseModel):
    resume_id: int


class CoverLetterRequest(BaseModel):
    resume_id: int


class StatusUpdateRequest(BaseModel):
    status: JobStatus


class LinkedInSyncRequest(BaseModel):
    linkedin_email: Optional[str] = None
    linkedin_password: Optional[str] = None


class LinkedInSyncResponse(BaseModel):
    found: int
    imported: int
    skipped: int


class DiscoverResponse(BaseModel):
    discovered: int
    scored: int
    jobs: list[JobListingResponse]

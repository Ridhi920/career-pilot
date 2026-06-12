from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    company: str = Field(..., min_length=1, max_length=255)
    job_title: str = Field(..., min_length=1, max_length=255)
    job_description: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.SAVED
    ats_score: Optional[float] = None
    notes: Optional[str] = None
    job_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company: Optional[str] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    ats_score: Optional[float] = None
    notes: Optional[str] = None
    job_url: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    company: str
    job_title: str
    job_description: Optional[str] = None
    status: ApplicationStatus
    ats_score: Optional[float] = None
    notes: Optional[str] = None
    job_url: Optional[str] = None
    job_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ApplicationMetrics(BaseModel):
    total: int
    saved: int
    applied: int
    interviews: int
    rejected: int
    offers: int
    success_rate: float

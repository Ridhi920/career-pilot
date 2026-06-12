from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any
from app.schemas.analysis import ATSScoreResponse


class ParsedResume(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: list[str] = []
    experience: list[dict[str, Any]] = []
    education: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    certifications: list[str] = []


class ResumeResponse(BaseModel):
    id: int
    file_name: str
    file_path: str
    resume_text: str
    parsed_data: Optional[ParsedResume] = None
    ats_analysis: Optional[ATSScoreResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    id: int
    file_name: str
    created_at: datetime
    parsed_data: Optional[ParsedResume] = None
    ats_analysis: Optional[ATSScoreResponse] = None

    model_config = {"from_attributes": True}


class ResumeVersionResponse(BaseModel):
    id: int
    resume_id: int
    content: str
    ats_score: Optional[float] = None
    change_summary: Optional[dict] = None
    job_description: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

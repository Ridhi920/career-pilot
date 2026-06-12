from pydantic import BaseModel, Field
from typing import Optional


class ATSAnalysisRequest(BaseModel):
    resume_id: int
    job_description: str = Field(..., min_length=50)


class ATSAnalysisResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    missing_skills: list[str] = []
    matching_skills: list[str] = []
    strengths: list[str] = []
    recommendations: list[str] = []
    keyword_coverage: float = Field(..., ge=0, le=100)
    experience_match: str = ""
    summary: str = ""


class ATSCategoryScore(BaseModel):
    category: str
    score: float = Field(..., ge=0, le=100)
    feedback: str = ""


class ATSImprovement(BaseModel):
    priority: str = "medium"
    section: str = ""
    suggestion: str


class ATSScoreResponse(BaseModel):
    score: float = Field(..., ge=0, le=100)
    rating: str = ""
    summary: str = ""
    breakdown: list[ATSCategoryScore] = []
    strengths: list[str] = []
    issues: list[str] = []
    improvements: list[ATSImprovement] = []
    keyword_suggestions: list[str] = []


class SkillGapItem(BaseModel):
    skill: str
    priority: str
    reason: str
    learning_time: Optional[str] = None


class SkillGapRequest(BaseModel):
    resume_id: int
    job_description: str = Field(..., min_length=50)


class SkillGapResponse(BaseModel):
    critical_missing: list[SkillGapItem] = []
    medium_priority: list[SkillGapItem] = []
    optional: list[SkillGapItem] = []
    learning_roadmap: list[str] = []
    estimated_preparation_time: Optional[str] = None


class ResumeGenerateRequest(BaseModel):
    resume_id: int
    job_description: str = Field(..., min_length=50)


class ResumeGenerateResponse(BaseModel):
    optimized_resume: str
    ats_score_before: float
    ats_score_after: float
    changes_made: list[str] = []
    version_id: int

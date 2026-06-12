from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analysis_service import AnalysisService
from app.schemas.analysis import (
    ATSAnalysisRequest,
    ATSAnalysisResponse,
    ATSScoreResponse,
    SkillGapRequest,
    SkillGapResponse,
    ResumeGenerateRequest,
    ResumeGenerateResponse,
)

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


@router.get("/ats-score/{resume_id}", response_model=ATSScoreResponse)
def ats_score(resume_id: int, refresh: bool = False, db: Session = Depends(get_db)):
    """General ATS readiness score for a resume (no job description required)."""
    return AnalysisService(db).score_resume(resume_id, refresh=refresh)


@router.post("/ats", response_model=ATSAnalysisResponse)
def analyze_ats(request: ATSAnalysisRequest, db: Session = Depends(get_db)):
    return AnalysisService(db).analyze_ats(request.resume_id, request.job_description)


@router.post("/skills", response_model=SkillGapResponse)
def skill_gap_analysis(request: SkillGapRequest, db: Session = Depends(get_db)):
    return AnalysisService(db).analyze_skill_gap(request.resume_id, request.job_description)


@router.post("/generate", response_model=ResumeGenerateResponse)
def generate_resume(request: ResumeGenerateRequest, db: Session = Depends(get_db)):
    return AnalysisService(db).generate_optimized_resume(request.resume_id, request.job_description)

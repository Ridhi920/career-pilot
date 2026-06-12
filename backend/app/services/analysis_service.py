from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.resume_repository import ResumeRepository
from app.services.llm_service import call_llm
from app.prompts.ats_prompts import (
    ATS_ANALYSIS_PROMPT,
    ATS_SCORE_PROMPT,
    SKILL_GAP_PROMPT,
    RESUME_GENERATE_PROMPT,
)
from app.schemas.analysis import (
    ATSAnalysisResponse,
    ATSScoreResponse,
    SkillGapResponse,
    ResumeGenerateResponse,
)


def compute_ats_score(resume_text: str) -> dict:
    """Score a resume standalone (no job description). Returns a validated dict."""
    prompt = ATS_SCORE_PROMPT.format(resume_text=resume_text[:4000])
    raw = call_llm(prompt)
    return ATSScoreResponse(**raw).model_dump()


class AnalysisService:
    def __init__(self, db: Session):
        self.repo = ResumeRepository(db)

    def _get_resume_or_404(self, resume_id: int):
        resume = self.repo.get_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume

    def score_resume(self, resume_id: int, refresh: bool = False) -> ATSScoreResponse:
        """General ATS score for a resume (no job description). Cached on the resume row."""
        resume = self._get_resume_or_404(resume_id)
        if resume.ats_analysis and not refresh:
            return ATSScoreResponse(**resume.ats_analysis)
        analysis = compute_ats_score(resume.resume_text)
        self.repo.update_ats_analysis(resume_id, analysis)
        return ATSScoreResponse(**analysis)

    def analyze_ats(self, resume_id: int, job_description: str) -> ATSAnalysisResponse:
        resume = self._get_resume_or_404(resume_id)
        prompt = ATS_ANALYSIS_PROMPT.format(
            resume_text=resume.resume_text[:4000],
            job_description=job_description[:3000],
        )
        raw = call_llm(prompt)
        return ATSAnalysisResponse(**raw)

    def analyze_skill_gap(self, resume_id: int, job_description: str) -> SkillGapResponse:
        resume = self._get_resume_or_404(resume_id)
        prompt = SKILL_GAP_PROMPT.format(
            resume_text=resume.resume_text[:4000],
            job_description=job_description[:3000],
        )
        raw = call_llm(prompt)
        return SkillGapResponse(**raw)

    def generate_optimized_resume(
        self, resume_id: int, job_description: str
    ) -> ResumeGenerateResponse:
        resume = self._get_resume_or_404(resume_id)

        # Get original ATS score first
        try:
            ats_result = self.analyze_ats(resume_id, job_description)
            original_score = ats_result.score
        except Exception:
            original_score = 0.0

        prompt = RESUME_GENERATE_PROMPT.format(
            resume_text=resume.resume_text[:4000],
            job_description=job_description[:3000],
            original_score=original_score,
        )
        raw = call_llm(prompt)

        # Store version
        version = self.repo.create_version(
            resume_id=resume_id,
            content=raw["optimized_resume"],
            ats_score=raw.get("ats_score_after", 0),
            change_summary={"changes": raw.get("changes_made", [])},
            job_description=job_description,
        )

        return ResumeGenerateResponse(
            optimized_resume=raw["optimized_resume"],
            ats_score_before=original_score,
            ats_score_after=raw.get("ats_score_after", 0),
            changes_made=raw.get("changes_made", []),
            version_id=version.id,
        )

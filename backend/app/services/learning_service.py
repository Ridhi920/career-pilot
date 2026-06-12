import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services.llm_service import call_llm
from app.prompts.learning_prompts import LEARNING_RECOMMEND_PROMPT, MARKET_SKILLS_PROMPT
from app.schemas.learning import LearningPlanResponse, MarketSkillsResponse
from app.repositories.job_repository import JobRepository
from app.repositories.resume_repository import ResumeRepository

# Sized so the prompt stays under Groq's free-tier 6000 tokens-per-minute limit
MAX_JOBS_ANALYZED = 25
DESC_EXCERPT_CHARS = 350


def _norm(s: str) -> str:
    """'React.js' / 'react js' / 'ReactJS' all normalize to 'reactjs'."""
    return re.sub(r"[^a-z0-9+#]", "", s.lower())


def _resume_vocab(resume_text: str, parsed_skills: list[str]) -> set[str]:
    vocab: set[str] = set()
    for skill in parsed_skills:
        vocab.add(_norm(skill))
        for word in re.split(r"[^A-Za-z0-9+#.]+", skill):
            if len(word) > 2:
                vocab.add(_norm(word))
    for word in re.split(r"[^A-Za-z0-9+#.]+", resume_text):
        if len(word) > 2:
            vocab.add(_norm(word))
    vocab.discard("")
    return vocab


def _skill_in_resume(skill: str, vocab: set[str]) -> bool:
    """True if the skill (or any variant inside 'Cloud (AWS/GCP)') appears in the resume."""
    candidates = [skill] + re.split(r"[/,()&]| and | or ", skill)
    for cand in candidates:
        cand = cand.strip()
        if len(cand) > 1 and _norm(cand) in vocab:
            return True
    return False


class LearningService:
    def recommend(
        self,
        skills: list[str],
        current_level: str = "beginner",
        target_role: str = "Software Engineer",
    ) -> LearningPlanResponse:
        prompt = LEARNING_RECOMMEND_PROMPT.format(
            skills=", ".join(skills),
            current_level=current_level,
            target_role=target_role or "Software Engineer",
        )
        raw = call_llm(prompt)
        return LearningPlanResponse(**raw)

    def market_skills(self, db: Session, resume_id: int | None = None) -> MarketSkillsResponse:
        """Mine discovered job descriptions for the most-demanded skills."""
        jobs = [j for j in JobRepository(db).get_all() if j.description]
        if not jobs:
            raise HTTPException(400, "No job descriptions to analyse. Run a job search first.")
        jobs = jobs[:MAX_JOBS_ANALYZED]

        digest = "\n".join(
            f"- {j.title} @ {j.company}: {j.description[:DESC_EXCERPT_CHARS]}"
            for j in jobs
        )

        resume_text, parsed_skills = "", []
        resume_repo = ResumeRepository(db)
        resume = resume_repo.get_by_id(resume_id) if resume_id else next(iter(resume_repo.get_all()), None)
        if resume:
            resume_text = (resume.resume_text or "")[:4000]
            parsed_skills = (resume.parsed_data or {}).get("skills") or []

        resume_block = resume_text or "(no resume provided)"
        if parsed_skills:
            resume_block = f"DECLARED SKILLS: {', '.join(parsed_skills)}\n\n{resume_block}"

        prompt = MARKET_SKILLS_PROMPT.format(
            job_count=len(jobs),
            jobs_digest=digest[:9000],
            resume_text=resume_block,
        )
        raw = call_llm(prompt)
        raw["analyzed_jobs"] = len(jobs)
        result = MarketSkillsResponse(**raw)

        # The LLM's in_resume judgement is unreliable — verify against the actual
        # resume and override wherever the skill provably appears in it.
        if resume:
            vocab = _resume_vocab(resume.resume_text or "", parsed_skills)
            for item in result.top_skills:
                if not item.in_resume and _skill_in_resume(item.skill, vocab):
                    item.in_resume = True
            covered = {s.skill for s in result.top_skills if s.in_resume}
            result.recommended_focus = [s for s in result.recommended_focus if s not in covered]

        return result

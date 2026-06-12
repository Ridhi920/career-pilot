import asyncio
from fastapi import HTTPException
from sqlalchemy.orm import Session
from loguru import logger

from app.repositories.job_repository import JobRepository
from app.repositories.resume_repository import ResumeRepository
from app.repositories.application_repository import ApplicationRepository
from app.models.job import JobStatus
from app.models.application import ApplicationStatus
from app.services.scraper_service import discover_jobs
from app.services.llm_service import call_llm
from app.services.telegram_service import send_job_digest
from app.prompts.job_prompts import SCORE_JOB_PROMPT, COVER_LETTER_PROMPT
from app.prompts.ats_prompts import RESUME_GENERATE_PROMPT


class JobService:
    def __init__(self, db: Session):
        self.repo = JobRepository(db)
        self.resume_repo = ResumeRepository(db)
        self.app_repo = ApplicationRepository(db)

    def _track_application(self, job, notes: str = "Marked as applied from Job Discovery"):
        """Mirror an applied job into the Application Tracker (dedups by job_id/url)."""
        if self.app_repo.get_by_job_id(job.id):
            return
        existing = self.app_repo.get_by_job_url(job.url) if job.url else None
        if existing:
            self.app_repo.update(existing.id, job_id=job.id, status=ApplicationStatus.APPLIED)
            return
        self.app_repo.create(
            company=job.company or "Unknown",
            job_title=job.title or "Unknown",
            job_description=job.description,
            status=ApplicationStatus.APPLIED,
            ats_score=job.match_score,
            job_url=job.url,
            job_id=job.id,
            notes=notes,
        )

    def _get_resume_or_404(self, resume_id: int):
        r = self.resume_repo.get_by_id(resume_id)
        if not r:
            raise HTTPException(404, "Resume not found")
        return r

    # ── Discovery ──────────────────────────────────────────────────────────────

    async def discover(
        self,
        query: str,
        location: str,
        sources: list[str],
        num_jobs: int,
        resume_id: int | None,
    ) -> dict:
        raw_jobs = await discover_jobs(query, location, sources, num_jobs)
        if not raw_jobs:
            return {"discovered": 0, "scored": 0, "jobs": []}

        # Attach resume_id
        for j in raw_jobs:
            j["resume_id"] = resume_id

        created = self.repo.bulk_create(raw_jobs)
        scored = 0

        # Auto-score if resume provided
        if resume_id and created:
            resume = self._get_resume_or_404(resume_id)
            sem = asyncio.Semaphore(3)

            async def score_one(job):
                nonlocal scored
                async with sem:
                    try:
                        result = self._score_job(job, resume.resume_text)
                        self.repo.update(
                            job.id,
                            match_score=result["score"],
                            match_data=result,
                            status=JobStatus.SCORED,
                        )
                        scored += 1
                    except Exception as e:
                        logger.warning(f"Score failed for job {job.id}: {e}")
                    await asyncio.sleep(0.3)

            await asyncio.gather(*[score_one(j) for j in created])

        jobs = self.repo.get_all()
        return {"discovered": len(created), "scored": scored, "jobs": jobs}

    def _score_job(self, job, resume_text: str) -> dict:
        prompt = SCORE_JOB_PROMPT.format(
            resume_text=resume_text[:3000],
            job_title=job.title,
            job_company=job.company,
            job_description=(job.description or "")[:2000],
        )
        return call_llm(prompt)

    # ── Score individual job ───────────────────────────────────────────────────

    def score_job(self, job_id: int, resume_id: int):
        job = self.repo.get_by_id(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        resume = self._get_resume_or_404(resume_id)

        result = self._score_job(job, resume.resume_text)
        updated = self.repo.update(
            job_id,
            match_score=result["score"],
            match_data=result,
            resume_id=resume_id,
            status=JobStatus.SCORED,
        )
        return updated

    # ── Cover letter ───────────────────────────────────────────────────────────

    def generate_cover_letter(self, job_id: int, resume_id: int):
        job = self.repo.get_by_id(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        resume = self._get_resume_or_404(resume_id)

        prompt = COVER_LETTER_PROMPT.format(
            resume_text=resume.resume_text[:3000],
            job_title=job.title,
            job_company=job.company,
            job_description=(job.description or "")[:2000],
        )
        raw = call_llm(prompt)
        cover_letter = raw.get("cover_letter", "")
        return self.repo.update(job_id, cover_letter=cover_letter)

    # ── Tailored resume ────────────────────────────────────────────────────────

    def generate_tailored_resume(self, job_id: int, resume_id: int):
        job = self.repo.get_by_id(job_id)
        if not job:
            raise HTTPException(404, "Job not found")
        resume = self._get_resume_or_404(resume_id)
        jd = job.description or f"{job.title} at {job.company}"

        prompt = RESUME_GENERATE_PROMPT.format(
            resume_text=resume.resume_text[:4000],
            job_description=jd[:2500],
            original_score=job.match_score or 0,
        )
        raw = call_llm(prompt)
        tailored = raw.get("optimized_resume", "")
        return self.repo.update(job_id, tailored_resume=tailored)

    # ── Status & list ─────────────────────────────────────────────────────────

    def list_jobs(self, status: str | None = None, source: str | None = None):
        return self.repo.get_all(status=status, source=source)

    def update_status(self, job_id: int, status: JobStatus):
        job = self.repo.update(job_id, status=status)
        if not job:
            raise HTTPException(404, "Job not found")
        if status == JobStatus.APPLIED:
            self._track_application(job)
        return job

    # ── LinkedIn sync ─────────────────────────────────────────────────────────

    async def sync_linkedin_applications(
        self,
        linkedin_email: str | None = None,
        linkedin_password: str | None = None,
    ) -> dict:
        """Scrape the user's LinkedIn 'Applied jobs' list and import into the tracker."""
        from app.services.linkedin_service import linkedin_fetch_applied_jobs
        from app.core.config import settings

        email = linkedin_email or settings.LINKEDIN_EMAIL
        password = linkedin_password or settings.LINKEDIN_PASSWORD
        if not email or not password:
            raise HTTPException(400, "LinkedIn credentials required. Provide in request or set LINKEDIN_EMAIL/LINKEDIN_PASSWORD in .env")

        result = await linkedin_fetch_applied_jobs(email, password)
        if result["status"] != "ok":
            raise HTTPException(502, f"LinkedIn sync failed: {result['message']}")

        imported, skipped = 0, 0
        for item in result["jobs"]:
            if self.app_repo.get_by_job_url(item["url"]):
                skipped += 1
                continue

            # Link to a discovered job listing if we have one for the same LinkedIn job id
            job = self.repo.get_by_url_fragment(item["job_view_id"])
            if job:
                if self.app_repo.get_by_job_id(job.id):
                    skipped += 1
                    continue
                self.repo.mark_applied(job.id)

            notes = "Imported from LinkedIn"
            if item.get("applied_text"):
                notes += f" ({item['applied_text']})"

            self.app_repo.create(
                company=item["company"] or "Unknown",
                job_title=item["title"],
                job_description=job.description if job else None,
                status=ApplicationStatus.APPLIED,
                ats_score=job.match_score if job else None,
                job_url=item["url"],
                job_id=job.id if job else None,
                notes=notes,
            )
            imported += 1

        return {"found": len(result["jobs"]), "imported": imported, "skipped": skipped}

    def delete_job(self, job_id: int):
        if not self.repo.delete(job_id):
            raise HTTPException(404, "Job not found")

    # ── Telegram digest ───────────────────────────────────────────────────────

    async def send_digest(self, min_score: float = 70.0):
        jobs = self.repo.get_top_matches(limit=10, min_score=min_score)
        success = await send_job_digest(jobs)
        return {"sent": success, "jobs_count": len(jobs)}

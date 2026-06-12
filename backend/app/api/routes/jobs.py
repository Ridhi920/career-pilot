from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.job_service import JobService
from app.schemas.job import (
    DiscoverRequest, DiscoverResponse, JobListingResponse,
    ScoreJobRequest, CoverLetterRequest, StatusUpdateRequest,
    LinkedInSyncRequest, LinkedInSyncResponse,
)

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("/discover", response_model=DiscoverResponse)
async def discover_jobs(request: DiscoverRequest, db: Session = Depends(get_db)):
    """Scrape LinkedIn/Naukri and optionally auto-score against a resume."""
    return await JobService(db).discover(
        query=request.query,
        location=request.location,
        sources=request.sources,
        num_jobs=request.num_jobs,
        resume_id=request.resume_id,
    )


@router.get("", response_model=list[JobListingResponse])
def list_jobs(
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return JobService(db).list_jobs(status=status, source=source)


@router.post("/{job_id}/score", response_model=JobListingResponse)
def score_job(job_id: int, request: ScoreJobRequest, db: Session = Depends(get_db)):
    return JobService(db).score_job(job_id, request.resume_id)


@router.post("/{job_id}/cover-letter", response_model=JobListingResponse)
def generate_cover_letter(job_id: int, request: CoverLetterRequest, db: Session = Depends(get_db)):
    return JobService(db).generate_cover_letter(job_id, request.resume_id)


@router.post("/{job_id}/tailored-resume", response_model=JobListingResponse)
def generate_tailored_resume(job_id: int, request: CoverLetterRequest, db: Session = Depends(get_db)):
    return JobService(db).generate_tailored_resume(job_id, request.resume_id)


@router.post("/sync-linkedin", response_model=LinkedInSyncResponse)
async def sync_linkedin(request: LinkedInSyncRequest, db: Session = Depends(get_db)):
    """Scrape the user's LinkedIn 'Applied jobs' page and import them into the Application Tracker."""
    return await JobService(db).sync_linkedin_applications(
        linkedin_email=request.linkedin_email,
        linkedin_password=request.linkedin_password,
    )


@router.patch("/{job_id}/status", response_model=JobListingResponse)
def update_status(job_id: int, request: StatusUpdateRequest, db: Session = Depends(get_db)):
    return JobService(db).update_status(job_id, request.status)


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    JobService(db).delete_job(job_id)


@router.post("/digest")
async def send_digest(min_score: float = Query(default=70.0), db: Session = Depends(get_db)):
    """Send top matched jobs to Telegram."""
    return await JobService(db).send_digest(min_score=min_score)

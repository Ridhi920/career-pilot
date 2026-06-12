from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.job import JobListing, JobStatus
from typing import Optional
from datetime import datetime, timezone


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> JobListing:
        job = JobListing(**kwargs)
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def bulk_create(self, jobs: list[dict]) -> list[JobListing]:
        created = []
        for data in jobs:
            # Skip duplicates by URL
            if not self.db.query(JobListing).filter(JobListing.url == data["url"]).first():
                job = JobListing(**data)
                self.db.add(job)
                created.append(job)
        self.db.commit()
        for job in created:
            self.db.refresh(job)
        return created

    def get_by_id(self, job_id: int) -> Optional[JobListing]:
        return self.db.query(JobListing).filter(JobListing.id == job_id).first()

    def get_all(self, status: Optional[str] = None, source: Optional[str] = None) -> list[JobListing]:
        q = self.db.query(JobListing)
        if status:
            q = q.filter(JobListing.status == status)
        if source:
            q = q.filter(JobListing.source == source)
        return q.order_by(
            JobListing.posted_at.desc().nullslast(),
            JobListing.match_score.desc().nullslast(),
            JobListing.created_at.desc(),
        ).all()

    def update(self, job_id: int, **kwargs) -> Optional[JobListing]:
        job = self.get_by_id(job_id)
        if not job:
            return None
        for key, value in kwargs.items():
            setattr(job, key, value)
        self.db.commit()
        self.db.refresh(job)
        return job

    def mark_applied(self, job_id: int) -> Optional[JobListing]:
        return self.update(job_id, status=JobStatus.APPLIED, applied_at=datetime.now(timezone.utc))

    def get_by_url_fragment(self, fragment: str) -> Optional[JobListing]:
        return self.db.query(JobListing).filter(JobListing.url.contains(fragment)).first()

    def delete(self, job_id: int) -> bool:
        job = self.get_by_id(job_id)
        if job:
            self.db.delete(job)
            self.db.commit()
            return True
        return False

    def get_unscored(self, resume_id: int) -> list[JobListing]:
        return (
            self.db.query(JobListing)
            .filter(JobListing.match_score.is_(None))
            .filter(JobListing.status != JobStatus.SKIPPED)
            .all()
        )

    def get_top_matches(self, limit: int = 10, min_score: float = 70.0) -> list[JobListing]:
        return (
            self.db.query(JobListing)
            .filter(JobListing.match_score >= min_score)
            .filter(JobListing.status.in_([JobStatus.SCORED, JobStatus.SAVED]))
            .order_by(JobListing.match_score.desc())
            .limit(limit)
            .all()
        )

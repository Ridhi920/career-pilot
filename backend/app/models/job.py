from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class JobStatus(str, enum.Enum):
    DISCOVERED = "Discovered"
    SCORED = "Scored"
    SAVED = "Saved"
    APPLIED = "Applied"
    SKIPPED = "Skipped"


class JobListing(Base):
    __tablename__ = "job_listings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=False)
    source = Column(String(50), nullable=False)       # linkedin | naukri | manual
    is_easy_apply = Column(Boolean, default=False)

    match_score = Column(Float, nullable=True)
    match_data = Column(JSON, nullable=True)           # matching/missing skills etc.
    cover_letter = Column(Text, nullable=True)
    tailored_resume = Column(Text, nullable=True)

    status = Column(String(50), default=JobStatus.DISCOVERED, nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)   # when the listing was posted on the source site
    applied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

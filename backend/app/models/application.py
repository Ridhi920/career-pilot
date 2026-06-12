from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ApplicationStatus(str, enum.Enum):
    SAVED = "Saved"
    APPLIED = "Applied"
    INTERVIEW = "Interview"
    REJECTED = "Rejected"
    OFFER = "Offer"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String(255), nullable=False)
    job_title = Column(String(255), nullable=False)
    job_description = Column(Text, nullable=True)
    status = Column(
        SAEnum(ApplicationStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=ApplicationStatus.SAVED,
        nullable=False,
    )
    ats_score = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    job_url = Column(String(500), nullable=True)
    job_id = Column(Integer, ForeignKey("job_listings.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

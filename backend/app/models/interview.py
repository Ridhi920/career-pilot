from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    feedback = Column(JSON, nullable=True)
    score = Column(Float, nullable=True)
    question_type = Column(String(50), nullable=True)
    job_role = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

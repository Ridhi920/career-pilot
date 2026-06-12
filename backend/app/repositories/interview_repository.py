from sqlalchemy.orm import Session
from app.models.interview import InterviewSession
from typing import Optional


class InterviewRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> InterviewSession:
        session = InterviewSession(**kwargs)
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_by_id(self, session_id: int) -> Optional[InterviewSession]:
        return self.db.query(InterviewSession).filter(InterviewSession.id == session_id).first()

    def get_all(self) -> list[InterviewSession]:
        return self.db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()

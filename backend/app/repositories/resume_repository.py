from sqlalchemy.orm import Session
from app.models.resume import Resume, ResumeVersion
from typing import Optional


class ResumeRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, file_name: str, file_path: str, resume_text: str) -> Resume:
        resume = Resume(file_name=file_name, file_path=file_path, resume_text=resume_text)
        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)
        return resume

    def update_parsed_data(self, resume_id: int, parsed_data: dict) -> Optional[Resume]:
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.parsed_data = parsed_data
            self.db.commit()
            self.db.refresh(resume)
        return resume

    def update_ats_analysis(self, resume_id: int, ats_analysis: dict) -> Optional[Resume]:
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            resume.ats_analysis = ats_analysis
            self.db.commit()
            self.db.refresh(resume)
        return resume

    def get_by_id(self, resume_id: int) -> Optional[Resume]:
        return self.db.query(Resume).filter(Resume.id == resume_id).first()

    def get_all(self) -> list[Resume]:
        return self.db.query(Resume).order_by(Resume.created_at.desc()).all()

    def delete(self, resume_id: int) -> bool:
        resume = self.db.query(Resume).filter(Resume.id == resume_id).first()
        if resume:
            self.db.delete(resume)
            self.db.commit()
            return True
        return False

    def create_version(
        self,
        resume_id: int,
        content: str,
        ats_score: float,
        change_summary: dict,
        job_description: str,
    ) -> ResumeVersion:
        version = ResumeVersion(
            resume_id=resume_id,
            content=content,
            ats_score=ats_score,
            change_summary=change_summary,
            job_description=job_description,
        )
        self.db.add(version)
        self.db.commit()
        self.db.refresh(version)
        return version

    def get_versions(self, resume_id: int) -> list[ResumeVersion]:
        return (
            self.db.query(ResumeVersion)
            .filter(ResumeVersion.resume_id == resume_id)
            .order_by(ResumeVersion.created_at.desc())
            .all()
        )

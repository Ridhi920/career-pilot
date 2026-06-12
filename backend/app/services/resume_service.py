import os
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.repositories.resume_repository import ResumeRepository
from app.services.llm_service import call_llm
from app.services.analysis_service import compute_ats_score
from app.utils.file_processor import extract_text
from app.prompts.ats_prompts import RESUME_PARSE_PROMPT
from loguru import logger


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


class ResumeService:
    def __init__(self, db: Session):
        self.repo = ResumeRepository(db)

    async def upload_resume(self, file: UploadFile) -> dict:
        suffix = Path(file.filename).suffix.lower()
        if suffix not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}. Use PDF or DOCX.")

        if file.size and file.size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_FILE_SIZE_MB}MB limit.")

        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / file.filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        try:
            resume_text = extract_text(str(file_path))
        except ValueError as e:
            os.remove(file_path)
            raise HTTPException(status_code=422, detail=str(e))

        if len(resume_text.strip()) < 50:
            os.remove(file_path)
            raise HTTPException(status_code=422, detail="Resume text is too short or could not be extracted.")

        resume = self.repo.create(
            file_name=file.filename,
            file_path=str(file_path),
            resume_text=resume_text,
        )

        # Parse resume in background (best-effort)
        try:
            parsed = self._parse_resume(resume_text)
            self.repo.update_parsed_data(resume.id, parsed)
            resume.parsed_data = parsed
        except Exception as e:
            logger.warning(f"Resume parsing failed (non-fatal): {e}")

        # General ATS score (best-effort; frontend can re-request via /api/analysis/ats-score)
        try:
            ats_analysis = compute_ats_score(resume_text)
            self.repo.update_ats_analysis(resume.id, ats_analysis)
            resume.ats_analysis = ats_analysis
        except Exception as e:
            logger.warning(f"ATS scoring failed (non-fatal): {e}")

        return resume

    def _parse_resume(self, resume_text: str) -> dict:
        prompt = RESUME_PARSE_PROMPT.format(resume_text=resume_text[:4000])
        return call_llm(prompt)

    def get_resume(self, resume_id: int):
        resume = self.repo.get_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return resume

    def list_resumes(self):
        return self.repo.get_all()

    def delete_resume(self, resume_id: int) -> bool:
        resume = self.repo.get_by_id(resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
        return self.repo.delete(resume_id)

    def get_versions(self, resume_id: int):
        self.get_resume(resume_id)  # validates existence
        return self.repo.get_versions(resume_id)

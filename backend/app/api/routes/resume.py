from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.resume_service import ResumeService
from app.schemas.resume import ResumeResponse, ResumeListItem, ResumeVersionResponse

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    service = ResumeService(db)
    return await service.upload_resume(file)


@router.get("", response_model=list[ResumeListItem])
def list_resumes(db: Session = Depends(get_db)):
    return ResumeService(db).list_resumes()


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(resume_id: int, db: Session = Depends(get_db)):
    return ResumeService(db).get_resume(resume_id)


@router.delete("/{resume_id}", status_code=204)
def delete_resume(resume_id: int, db: Session = Depends(get_db)):
    ResumeService(db).delete_resume(resume_id)


@router.get("/{resume_id}/versions", response_model=list[ResumeVersionResponse])
def get_versions(resume_id: int, db: Session = Depends(get_db)):
    return ResumeService(db).get_versions(resume_id)

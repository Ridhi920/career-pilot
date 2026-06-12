from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.interview_service import InterviewService
from app.schemas.interview import (
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    EvaluateAnswerRequest,
    InterviewSessionResponse,
)

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.post("/questions", response_model=InterviewQuestionsResponse)
def generate_questions(request: InterviewQuestionsRequest, db: Session = Depends(get_db)):
    return InterviewService(db).generate_questions(
        job_description=request.job_description,
        job_role=request.job_role,
        num_questions=request.num_questions,
        resume_id=request.resume_id,
    )


@router.post("/evaluate", response_model=InterviewSessionResponse)
def evaluate_answer(request: EvaluateAnswerRequest, db: Session = Depends(get_db)):
    return InterviewService(db).evaluate_answer(
        question=request.question,
        answer=request.answer,
        question_type=request.question_type,
        job_role=request.job_role,
    )


@router.get("/sessions", response_model=list[InterviewSessionResponse])
def get_sessions(db: Session = Depends(get_db)):
    return InterviewService(db).get_sessions()

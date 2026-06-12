from sqlalchemy.orm import Session
from app.repositories.interview_repository import InterviewRepository
from app.repositories.resume_repository import ResumeRepository
from app.services.llm_service import call_llm
from app.prompts.interview_prompts import INTERVIEW_QUESTIONS_PROMPT, EVALUATE_ANSWER_PROMPT
from app.schemas.interview import InterviewQuestionsResponse, EvaluateFeedback, InterviewSessionResponse
from loguru import logger


class InterviewService:
    def __init__(self, db: Session):
        self.repo = InterviewRepository(db)
        self.resume_repo = ResumeRepository(db)

    def generate_questions(
        self,
        job_description: str,
        job_role: str,
        num_questions: int = 5,
        resume_id: int = None,
    ) -> InterviewQuestionsResponse:
        candidate_context = "No resume provided."
        if resume_id:
            resume = self.resume_repo.get_by_id(resume_id)
            if resume:
                candidate_context = resume.resume_text[:2000]

        prompt = INTERVIEW_QUESTIONS_PROMPT.format(
            job_role=job_role,
            job_description=job_description[:2000],
            candidate_context=candidate_context,
            num_questions=num_questions,
        )
        raw = call_llm(prompt)
        return InterviewQuestionsResponse(**raw)

    def evaluate_answer(
        self,
        question: str,
        answer: str,
        question_type: str = "general",
        job_role: str = "Software Engineer",
    ) -> InterviewSessionResponse:
        prompt = EVALUATE_ANSWER_PROMPT.format(
            question=question,
            answer=answer,
            question_type=question_type,
            job_role=job_role or "Software Engineer",
        )
        raw = call_llm(prompt)
        feedback = EvaluateFeedback(**raw)

        session = self.repo.create(
            question=question,
            answer=answer,
            feedback=feedback.model_dump(),
            score=feedback.score,
            question_type=question_type,
            job_role=job_role,
        )

        return InterviewSessionResponse(
            id=session.id,
            question=session.question,
            answer=session.answer,
            feedback=feedback,
            score=session.score,
            question_type=session.question_type,
            job_role=session.job_role,
            created_at=session.created_at,
        )

    def get_sessions(self) -> list[InterviewSessionResponse]:
        sessions = self.repo.get_all()
        result = []
        for s in sessions:
            feedback = EvaluateFeedback(**s.feedback) if s.feedback else None
            result.append(InterviewSessionResponse(
                id=s.id,
                question=s.question,
                answer=s.answer,
                feedback=feedback,
                score=s.score,
                question_type=s.question_type,
                job_role=s.job_role,
                created_at=s.created_at,
            ))
        return result

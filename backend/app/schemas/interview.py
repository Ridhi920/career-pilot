from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class InterviewQuestionsRequest(BaseModel):
    resume_id: Optional[int] = None
    job_description: str = Field(..., min_length=20)
    job_role: str = Field(..., min_length=2)
    num_questions: int = Field(default=5, ge=1, le=10)


class InterviewQuestionsResponse(BaseModel):
    technical: list[str] = []
    behavioral: list[str] = []
    scenario: list[str] = []
    company_style: list[str] = []
    job_role: str


class EvaluateAnswerRequest(BaseModel):
    question: str = Field(..., min_length=10)
    answer: str = Field(..., min_length=10)
    question_type: Optional[str] = "general"
    job_role: Optional[str] = None


class EvaluateFeedback(BaseModel):
    score: float = Field(..., ge=0, le=10)
    strengths: list[str] = []
    weaknesses: list[str] = []
    improved_answer: str
    star_format_used: bool
    clarity_score: float
    technical_accuracy_score: float
    communication_score: float
    tip: str


class InterviewSessionResponse(BaseModel):
    id: int
    question: str
    answer: Optional[str] = None
    feedback: Optional[EvaluateFeedback] = None
    score: Optional[float] = None
    question_type: Optional[str] = None
    job_role: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}

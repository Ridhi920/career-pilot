from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.learning_service import LearningService
from app.services.trends_service import fetch_tech_pulse
from app.schemas.learning import (
    LearningRecommendRequest,
    LearningPlanResponse,
    MarketSkillsRequest,
    MarketSkillsResponse,
    TechPulseResponse,
)

router = APIRouter(prefix="/api/learning", tags=["Learning"])


@router.post("/recommend", response_model=LearningPlanResponse)
def recommend_learning(request: LearningRecommendRequest, db: Session = Depends(get_db)):
    service = LearningService()
    return service.recommend(
        skills=request.skills,
        current_level=request.current_level,
        target_role=request.target_role,
    )


@router.post("/market-skills", response_model=MarketSkillsResponse)
def market_skills(request: MarketSkillsRequest, db: Session = Depends(get_db)):
    """Analyse discovered job descriptions for the most in-demand skills."""
    service = LearningService()
    return service.market_skills(db, resume_id=request.resume_id)


@router.get("/tech-pulse", response_model=TechPulseResponse)
async def tech_pulse(refresh: bool = False):
    """Live trending technologies and AI models from GitHub, Hugging Face and Hacker News."""
    try:
        raw = await fetch_tech_pulse(force_refresh=refresh)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    return TechPulseResponse(**raw)

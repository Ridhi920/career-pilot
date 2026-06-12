from pydantic import BaseModel, Field
from typing import Optional


class LearningResource(BaseModel):
    title: str
    url: Optional[str] = None
    type: str  # course, book, article, video
    platform: Optional[str] = None
    duration: Optional[str] = None
    free: bool = True


class SkillRoadmap(BaseModel):
    step: int
    topic: str
    description: str
    duration: str


class LearningRecommendRequest(BaseModel):
    skills: list[str] = Field(..., min_length=1)
    current_level: Optional[str] = "beginner"
    target_role: Optional[str] = None


class LearningRecommendResponse(BaseModel):
    skill: str
    why_important: str
    roadmap: list[SkillRoadmap] = []
    resources: list[LearningResource] = []
    projects: list[str] = []
    total_duration: str


class LearningPlanResponse(BaseModel):
    skills: list[LearningRecommendResponse] = []
    overall_timeline: str
    priority_order: list[str] = []


class MarketSkillsRequest(BaseModel):
    resume_id: Optional[int] = None        # defaults to the latest uploaded resume


class MarketSkillItem(BaseModel):
    skill: str
    demand: int                            # postings asking for this skill
    category: str = "other"
    trend: str = "stable"                  # rising | stable | declining
    insight: str = ""
    in_resume: bool = False


class MarketSkillsResponse(BaseModel):
    analyzed_jobs: int
    summary: str
    top_skills: list[MarketSkillItem] = []
    recommended_focus: list[str] = []


class AIHighlight(BaseModel):
    name: str
    type: str = "model"                    # model | tool | framework | release
    source: str = "huggingface"            # github | huggingface | hackernews
    what_it_is: str = ""
    why_it_matters: str = ""


class TrendingTech(BaseModel):
    name: str
    category: str = "other"
    momentum: str = "steady"               # exploding | hot | steady
    summary: str = ""


class TechPulseResponse(BaseModel):
    summary: str
    ai_highlights: list[AIHighlight] = []
    trending_tech: list[TrendingTech] = []
    learn_next: list[str] = []
    sources: dict[str, int] = {}           # how many items each source contributed

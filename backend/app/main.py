from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import resume, analysis, interview, applications, learning, jobs

import app.models  # noqa: F401 — register all models with Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Career Pilot API...")
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables ensured.")
    yield


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered Career Copilot API",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(resume.router)
    app.include_router(analysis.router)
    app.include_router(interview.router)
    app.include_router(applications.router)
    app.include_router(learning.router)
    app.include_router(jobs.router)

    @app.get("/health", tags=["Health"])
    def health_check():
        return {"status": "ok", "version": settings.APP_VERSION}

    return app


app = create_application()

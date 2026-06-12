from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.services.application_service import ApplicationService
from app.schemas.application import (
    ApplicationCreate,
    ApplicationUpdate,
    ApplicationResponse,
    ApplicationMetrics,
)

router = APIRouter(prefix="/api/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponse, status_code=201)
def create_application(data: ApplicationCreate, db: Session = Depends(get_db)):
    return ApplicationService(db).create(data)


@router.get("", response_model=list[ApplicationResponse])
def list_applications(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return ApplicationService(db).get_all(status=status)


@router.get("/metrics", response_model=ApplicationMetrics)
def get_metrics(db: Session = Depends(get_db)):
    return ApplicationService(db).get_metrics()


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: int, db: Session = Depends(get_db)):
    return ApplicationService(db).get_by_id(app_id)


@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, data: ApplicationUpdate, db: Session = Depends(get_db)):
    return ApplicationService(db).update(app_id, data)


@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(get_db)):
    ApplicationService(db).delete(app_id)

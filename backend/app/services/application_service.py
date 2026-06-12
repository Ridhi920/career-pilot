from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.repositories.application_repository import ApplicationRepository
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationMetrics


class ApplicationService:
    def __init__(self, db: Session):
        self.repo = ApplicationRepository(db)

    def create(self, data: ApplicationCreate):
        return self.repo.create(**data.model_dump())

    def get_all(self, status: str = None):
        return self.repo.get_all(status=status)

    def get_by_id(self, app_id: int):
        app = self.repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app

    def update(self, app_id: int, data: ApplicationUpdate):
        app = self.repo.update(app_id, **data.model_dump(exclude_none=True))
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
        return app

    def delete(self, app_id: int) -> bool:
        deleted = self.repo.delete(app_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Application not found")
        return True

    def get_metrics(self) -> ApplicationMetrics:
        data = self.repo.get_metrics()
        return ApplicationMetrics(**data)

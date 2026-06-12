from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.application import Application, ApplicationStatus
from typing import Optional


class ApplicationRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Application:
        app = Application(**kwargs)
        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return app

    def get_by_id(self, app_id: int) -> Optional[Application]:
        return self.db.query(Application).filter(Application.id == app_id).first()

    def get_by_job_id(self, job_id: int) -> Optional[Application]:
        return self.db.query(Application).filter(Application.job_id == job_id).first()

    def get_by_job_url(self, job_url: str) -> Optional[Application]:
        return self.db.query(Application).filter(Application.job_url == job_url).first()

    def get_all(self, status: Optional[str] = None) -> list[Application]:
        query = self.db.query(Application)
        if status:
            query = query.filter(Application.status == status)
        return query.order_by(Application.created_at.desc()).all()

    def update(self, app_id: int, **kwargs) -> Optional[Application]:
        app = self.get_by_id(app_id)
        if not app:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(app, key, value)
        self.db.commit()
        self.db.refresh(app)
        return app

    def delete(self, app_id: int) -> bool:
        app = self.get_by_id(app_id)
        if app:
            self.db.delete(app)
            self.db.commit()
            return True
        return False

    def get_metrics(self) -> dict:
        total = self.db.query(func.count(Application.id)).scalar()
        by_status = (
            self.db.query(Application.status, func.count(Application.id))
            .group_by(Application.status)
            .all()
        )
        status_map = {s.value: 0 for s in ApplicationStatus}
        for status, count in by_status:
            status_map[status.value] = count

        offers = status_map.get("Offer", 0)
        applied = status_map.get("Applied", 0) + status_map.get("Interview", 0) + offers + status_map.get("Rejected", 0)
        success_rate = round((offers / applied * 100) if applied > 0 else 0, 1)

        return {
            "total": total or 0,
            "saved": status_map.get("Saved", 0),
            "applied": status_map.get("Applied", 0),
            "interviews": status_map.get("Interview", 0),
            "rejected": status_map.get("Rejected", 0),
            "offers": offers,
            "success_rate": success_rate,
        }

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobStatus, Lead
from ..schemas import StatsResponse

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("/", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    return StatsResponse(
        total_jobs=db.query(Job).count(),
        total_leads=db.query(Lead).count(),
        pending_jobs=db.query(Job).filter(Job.status == JobStatus.PENDING).count(),
        running_jobs=db.query(Job).filter(Job.status == JobStatus.RUNNING).count(),
        done_jobs=db.query(Job).filter(Job.status == JobStatus.DONE).count(),
        failed_jobs=db.query(Job).filter(Job.status == JobStatus.FAILED).count(),
    )

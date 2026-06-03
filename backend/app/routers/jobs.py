from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, JobStatus
from ..schemas import JobCreate, JobResponse
from ..worker import run_scrape_job

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.post("/", response_model=JobResponse, status_code=201)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    job = Job(**job_in.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)

    task = run_scrape_job.apply_async(
        kwargs=dict(
            job_id=str(job.id),
            query=job.query,
            lat=job.lat,
            lng=job.lng,
            radius=job.radius,
            max_results=job.max_results,
            scrolls=job.scrolls,
            timeout_seconds=job.timeout_seconds,
            delay_seconds=job.delay_seconds,
        ),
        queue="scrape",
    )

    job.celery_task_id = task.id
    db.commit()
    db.refresh(job)
    return job


@router.get("/", response_model=List[JobResponse])
def list_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("/{job_id}/cancel")
def cancel_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status not in (JobStatus.PENDING, JobStatus.RUNNING):
        raise HTTPException(400, f"Cannot cancel job with status '{job.status}'")

    if job.celery_task_id:
        run_scrape_job.AsyncResult(job.celery_task_id).revoke(terminate=True, signal="SIGTERM")

    job.status = JobStatus.CANCELLED
    job.finished_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.delete("/{job_id}", status_code=204)
def delete_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(404, "Job not found")
    if job.celery_task_id and job.status in (JobStatus.PENDING, JobStatus.RUNNING):
        run_scrape_job.AsyncResult(job.celery_task_id).revoke(terminate=True, signal="SIGTERM")
    db.delete(job)
    db.commit()

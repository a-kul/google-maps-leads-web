from __future__ import annotations

import uuid
from datetime import datetime

from .celery_app import celery
from .database import SessionLocal
from .models import Job, JobStatus, Lead
from .scraper import LeadData, scrape_google_maps


@celery.task(bind=True, queue="scrape", name="app.worker.run_scrape_job")
def run_scrape_job(
    self,
    job_id: str,
    query: str,
    lat: float | None,
    lng: float | None,
    radius: float | None,
    max_results: int,
    scrolls: int,
    timeout_seconds: float,
    delay_seconds: float,
) -> None:
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return

        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()
        job.celery_task_id = self.request.id
        db.commit()

        leads_count = [0]

        def on_lead(lead: LeadData) -> bool:
            db.refresh(job)
            if job.status == JobStatus.CANCELLED:
                return True

            db.add(Lead(
                job_id=uuid.UUID(job_id),
                place_id=lead.place_id,
                name=lead.name,
                address=lead.address,
                phone=lead.phone,
                website=lead.website,
                google_maps_url=lead.google_maps_url,
                rating=lead.rating,
                review_count=lead.review_count,
                latitude=lead.latitude,
                longitude=lead.longitude,
                distance_meters=lead.distance_meters,
            ))
            leads_count[0] += 1
            job.leads_found = leads_count[0]
            db.commit()
            return False

        scrape_google_maps(
            query,
            lat=lat,
            lng=lng,
            radius=radius,
            max_results=max_results,
            scrolls=scrolls,
            timeout_seconds=timeout_seconds,
            delay_seconds=delay_seconds,
            on_lead=on_lead,
        )

        db.refresh(job)
        if job.status != JobStatus.CANCELLED:
            job.status = JobStatus.DONE
        job.finished_at = datetime.utcnow()
        db.commit()

    except Exception as exc:
        db.rollback()
        try:
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(exc)[:2000]
                job.finished_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass
        raise
    finally:
        db.close()

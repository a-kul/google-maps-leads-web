from celery import Celery

from .config import settings

celery = Celery(
    "google_maps_leads",
    broker=settings.celery_broker_url,
    include=["app.worker"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_routes={"app.worker.run_scrape_job": {"queue": "scrape"}},
)

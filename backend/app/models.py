from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class JobStatus(str, PyEnum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query = Column(String, nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    radius = Column(Float, nullable=True)
    max_results = Column(Integer, default=50)
    scrolls = Column(Integer, default=20)
    timeout_seconds = Column(Float, default=30.0)
    delay_seconds = Column(Float, default=0.4)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.PENDING)
    leads_found = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    celery_task_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    leads = relationship("Lead", back_populates="job", cascade="all, delete-orphan", lazy="dynamic")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    place_id = Column(String, default="")
    name = Column(String, default="")
    address = Column(String, default="")
    phone = Column(String, default="")
    website = Column(String, default="")
    google_maps_url = Column(String, default="")
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_meters = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    job = relationship("Job", back_populates="leads")

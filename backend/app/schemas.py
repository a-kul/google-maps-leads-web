from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class JobCreate(BaseModel):
    query: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius: Optional[float] = None
    max_results: int = 50
    scrolls: int = 20
    timeout_seconds: float = 30.0
    delay_seconds: float = 0.4

    @field_validator("query")
    @classmethod
    def query_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("query must not be empty")
        return v.strip()


class JobResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    query: str
    lat: Optional[float]
    lng: Optional[float]
    radius: Optional[float]
    max_results: int
    scrolls: int
    timeout_seconds: float
    delay_seconds: float
    status: str
    leads_found: int
    error_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]


class LeadResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    job_id: UUID
    place_id: str
    name: str
    address: str
    phone: str
    website: str
    google_maps_url: str
    rating: Optional[float]
    review_count: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    distance_meters: Optional[int]
    created_at: datetime


class StatsResponse(BaseModel):
    total_jobs: int
    total_leads: int
    pending_jobs: int
    running_jobs: int
    done_jobs: int
    failed_jobs: int

from __future__ import annotations

import csv
import io
import json
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Job, Lead
from ..schemas import LeadResponse

router = APIRouter(prefix="/api/v1", tags=["leads"])


@router.get("/jobs/{job_id}/leads", response_model=List[LeadResponse])
def get_job_leads(
    job_id: UUID,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    if not db.query(Job).filter(Job.id == job_id).first():
        raise HTTPException(404, "Job not found")

    q = db.query(Lead).filter(Lead.job_id == job_id)
    if search:
        pattern = f"%{search}%"
        q = q.filter(Lead.name.ilike(pattern) | Lead.address.ilike(pattern) | Lead.phone.ilike(pattern))
    return q.order_by(Lead.created_at.asc()).offset(skip).limit(limit).all()


@router.get("/jobs/{job_id}/leads/export")
def export_job_leads(
    job_id: UUID,
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: Session = Depends(get_db),
):
    if not db.query(Job).filter(Job.id == job_id).first():
        raise HTTPException(404, "Job not found")

    leads = db.query(Lead).filter(Lead.job_id == job_id).order_by(Lead.created_at.asc()).all()

    if format == "json":
        data = [LeadResponse.model_validate(lead).model_dump(mode="json") for lead in leads]
        content = json.dumps(data, ensure_ascii=False, indent=2)
        return Response(
            content=content.encode("utf-8"),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="leads_{job_id}.json"'},
        )

    output = io.StringIO()
    cols = ["name", "address", "phone", "website", "google_maps_url", "rating", "review_count", "latitude", "longitude", "distance_meters"]
    writer = csv.DictWriter(output, fieldnames=cols, extrasaction="ignore")
    writer.writeheader()
    for lead in leads:
        writer.writerow({c: getattr(lead, c, "") for c in cols})

    return Response(
        content=output.getvalue().encode("utf-8"),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="leads_{job_id}.csv"'},
    )


@router.get("/leads", response_model=List[LeadResponse])
def list_all_leads(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Lead)
    if search:
        pattern = f"%{search}%"
        q = q.filter(Lead.name.ilike(pattern) | Lead.address.ilike(pattern) | Lead.phone.ilike(pattern))
    return q.order_by(Lead.created_at.desc()).offset(skip).limit(limit).all()

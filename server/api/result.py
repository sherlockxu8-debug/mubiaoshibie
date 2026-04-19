from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime

from models.models import DetectionResult, Video
from models.schemas import DetectionResultResponse, DetectionResultDetail, PaginatedResponse
from services.database import get_db

router = APIRouter(prefix="/result", tags=["result"])


@router.get("/", response_model=PaginatedResponse)
def get_results(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    video_id: Optional[int] = None,
    class_name: Optional[str] = None,
    camera_id: Optional[str] = None,
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    min_confidence: Optional[float] = Query(None, ge=0, le=1),
    db: Session = Depends(get_db),
):
    query = db.query(DetectionResult)

    if video_id:
        query = query.filter(DetectionResult.video_id == video_id)

    if class_name:
        query = query.filter(DetectionResult.class_name.like(f"%{class_name}%"))

    if min_confidence:
        query = query.filter(DetectionResult.confidence >= min_confidence)

    if start_time or end_time:
        video_query = db.query(Video.id)
        if camera_id:
            video_query = video_query.filter(Video.camera_id == camera_id)
        if start_time:
            video_query = video_query.filter(Video.created_at >= start_time)
        if end_time:
            video_query = video_query.filter(Video.created_at <= end_time)
        video_ids = [v.id for v in video_query.all()]
        query = query.filter(DetectionResult.video_id.in_(video_ids))

    total = query.count()
    results = (
        query.order_by(DetectionResult.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": results, "total": total, "page": page, "page_size": page_size}


@router.get("/{result_id}", response_model=DetectionResultDetail)
def get_result(result_id: int, db: Session = Depends(get_db)):
    result = db.query(DetectionResult).filter(DetectionResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

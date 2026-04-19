import os
import yaml
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from models.models import Video, Camera
from models.schemas import VideoResponse, VideoStatusResponse, PaginatedResponse
from services.database import get_db
from services.detector import YOLODetector
from services.video_processor import VideoProcessor

config_path = Path(__file__).parent.parent / "config.yaml"
with open(config_path, "r") as f:
    config = yaml.safe_load(f)

upload_dir = Path(__file__).parent.parent.parent / config["video"]["upload_dir"]
upload_dir.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/video", tags=["video"])

detector = YOLODetector(
    model_path=str(Path(__file__).parent.parent.parent / config["yolo"]["model_path"]),
    conf_threshold=config["yolo"]["conf_threshold"],
    iou_threshold=config["yolo"]["iou_threshold"],
    device=config["yolo"]["device"],
)
processor = VideoProcessor(detector)

processing_videos = {}


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    camera_id: str = Form(...),
    db: Session = Depends(get_db),
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=400, detail="Camera not found")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in config["video"]["supported_formats"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported: {config['video']['supported_formats']}",
        )

    unique_filename = f"{camera_id}_{Path(file.filename).stem}_{hash(file.filename)}{file_ext}"
    file_path = upload_dir / unique_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_video = Video(
        filename=file.filename,
        file_path=str(file_path),
        camera_id=camera_id,
        status="pending",
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    # Start processing in background
    import asyncio
    def progress_callback(processed: int, total: int):
        processing_videos[db_video.id] = processed

    asyncio.create_task(
        processor.process_video(db, db_video.id, str(file_path), progress_callback=progress_callback)
    )

    return {
        "id": db_video.id,
        "filename": db_video.filename,
        "camera_id": db_video.camera_id,
        "status": "processing",
        "message": "Video uploaded successfully, processing started",
    }


@router.get("/{video_id}/status", response_model=VideoStatusResponse)
def get_video_status(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    progress = None
    processed_frames = None

    if video.status == "processing" and video_id in processing_videos:
        processed_frames = processing_videos[video_id]
        if video.frame_count:
            progress = int((processed_frames / video.frame_count) * 100)

    return {
        "id": video.id,
        "status": video.status,
        "progress": progress,
        "total_frames": video.frame_count,
        "processed_frames": processed_frames,
    }


@router.get("/", response_model=PaginatedResponse)
def get_videos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    camera_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Video)

    if camera_id:
        query = query.filter(Video.camera_id == camera_id)
    if status:
        query = query.filter(Video.status == status)

    total = query.count()
    videos = (
        query.order_by(Video.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {"items": videos, "total": total, "page": page, "page_size": page_size}


@router.post("/{video_id}/process")
async def process_video(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    if video.status not in ("pending", "failed"):
        raise HTTPException(status_code=400, detail="Video already processed or processing")

    def progress_callback(processed: int, total: int):
        processing_videos[video_id] = processed

    success = await processor.process_video(
        db, video_id, video.file_path, progress_callback=progress_callback
    )

    if video_id in processing_videos:
        del processing_videos[video_id]

    if success:
        return {"message": "Video processed successfully", "video_id": video_id}
    else:
        raise HTTPException(status_code=500, detail="Video processing failed")

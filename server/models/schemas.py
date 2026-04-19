from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CameraBase(BaseModel):
    id: str
    location: str
    building: Optional[str] = None
    floor: Optional[int] = None
    description: Optional[str] = None


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    location: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None


class CameraResponse(CameraBase):
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class VideoBase(BaseModel):
    filename: str
    camera_id: str


class VideoCreate(VideoBase):
    pass


class VideoResponse(VideoBase):
    id: int
    file_path: str
    status: str
    duration: Optional[float] = None
    frame_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VideoStatusResponse(BaseModel):
    id: int
    status: str
    progress: Optional[int] = None
    total_frames: Optional[int] = None
    processed_frames: Optional[int] = None


class DetectionResultBase(BaseModel):
    class_name: str
    confidence: float
    bbox: str
    timestamp: float
    frame_index: Optional[int] = None


class DetectionResultResponse(DetectionResultBase):
    id: int
    video_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DetectionResultDetail(DetectionResultResponse):
    video: VideoResponse


class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int

import cv2
import json
import asyncio
from pathlib import Path
from typing import Optional, Callable
from sqlalchemy.orm import Session

from models.models import Video, DetectionResult
from services.detector import YOLODetector, Detection


class VideoProcessor:
    def __init__(self, detector: YOLODetector):
        self.detector = detector

    def get_video_info(self, video_path: str) -> tuple[Optional[float], Optional[int]]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None, None

        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else None

        cap.release()
        return duration, frame_count

    async def process_video(
        self,
        db: Session,
        video_id: int,
        video_path: str,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> bool:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return False

        try:
            duration, frame_count = self.get_video_info(video_path)
            video.duration = duration
            video.frame_count = frame_count
            video.status = "processing"
            db.commit()

            detections = await asyncio.to_thread(
                self._detect_video, video_path, frame_count, progress_callback
            )

            for det in detections:
                result = DetectionResult(
                    video_id=video_id,
                    class_name=det.class_name,
                    confidence=det.confidence,
                    bbox=json.dumps(
                        {"x1": det.bbox[0], "y1": det.bbox[1], "x2": det.bbox[2], "y2": det.bbox[3]}
                    ),
                    timestamp=det.timestamp,
                    frame_index=det.frame_index,
                )
                db.add(result)

            video.status = "completed"
            db.commit()
            return True

        except Exception as e:
            video.status = "failed"
            db.commit()
            print(f"Error processing video {video_id}: {e}")
            return False

    def _detect_video(
        self,
        video_path: str,
        total_frames: int,
        progress_callback: Optional[Callable[[int, int], None]],
    ) -> list:
        def frame_callback(frame_index: int, total: int, detections: list):
            if progress_callback:
                progress_callback(frame_index, total)

        detections = self.detector.detect_video(video_path, callback=frame_callback)
        return detections

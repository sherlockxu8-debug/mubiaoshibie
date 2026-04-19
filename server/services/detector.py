import yaml
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional, Callable
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None


@dataclass
class Detection:
    class_name: str
    confidence: float
    bbox: List[int]
    timestamp: float
    frame_index: int


class YOLODetector:
    def __init__(
        self,
        model_path: str,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: str = "cpu",
    ):
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.device = device
        self.model = None

        if YOLO is not None:
            model_file = Path(model_path)
            if model_file.exists():
                self.model = YOLO(model_path)
                self.model.to(device)
                self._warmup()
            else:
                print(f"Warning: Model file not found at {model_path}, using pretrained model")
                self.model = YOLO("yolov8n.pt")
                self.model.to(device)
                self._warmup()

    def _warmup(self):
        if self.model:
            dummy_frame = np.zeros((640, 640, 3), dtype=np.uint8)
            self.model(dummy_frame, verbose=False)

    def detect_frame(self, frame: np.ndarray) -> List[Detection]:
        if self.model is None:
            return []

        results = self.model(frame, conf=self.conf_threshold, iou=self.iou_threshold, verbose=False)

        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    cls_name = result.names[cls_id]

                    detections.append(
                        Detection(
                            class_name=cls_name,
                            confidence=conf,
                            bbox=[int(x1), int(y1), int(x2), int(y2)],
                            timestamp=0.0,
                            frame_index=0,
                        )
                    )

        return detections

    def detect_video(
        self,
        video_path: str,
        fps: float = 30.0,
        callback: Optional[Callable[[int, int, List[Detection]], None]] = None,
    ) -> List[Detection]:
        import cv2

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return []

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_index = 0
        all_detections = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            detections = self.detect_frame(frame)
            for det in detections:
                det.timestamp = frame_index / fps
                det.frame_index = frame_index

            all_detections.extend(detections)

            if callback:
                callback(frame_index, total_frames, detections)

            frame_index += 1

        cap.release()
        return all_detections

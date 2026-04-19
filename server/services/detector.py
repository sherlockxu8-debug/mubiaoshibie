"""
YOLO 检测模块
用于加载 YOLO 模型并进行目标检测
"""
import yaml
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional, Callable, Dict, Any
from datetime import datetime
import numpy as np

try:
    from ultralytics import YOLO
    import torch
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    YOLO = None
    torch = None


@dataclass
class Detection:
    """检测结果数据类"""
    class_name: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    timestamp: float = 0.0
    frame_index: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "class_name": self.class_name,
            "confidence": self.confidence,
            "bbox": self.bbox,
            "timestamp": self.timestamp,
            "frame_index": self.frame_index
        }


@dataclass
class ModelInfo:
    """模型信息类"""
    model_path: str
    loaded: bool = False
    device: str = "cpu"
    model_name: str = ""
    num_classes: int = 0
    class_names: List[str] = field(default_factory=list)
    load_time: Optional[datetime] = None
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model_path": self.model_path,
            "loaded": self.loaded,
            "device": self.device,
            "model_name": self.model_name,
            "num_classes": self.num_classes,
            "class_names": self.class_names,
            "load_time": self.load_time.isoformat() if self.load_time else None,
            "error": self.error
        }


class YOLODetector:
    """
    YOLO 检测器类
    支持加载自定义模型或使用预训练模型
    """

    _instance = None  # 单例实例

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        device: str = "cpu",
    ):
        if self._initialized:
            return

        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.model_path = model_path
        self.device = device
        self.model = None
        self.model_info = ModelInfo(model_path=model_path, device=device)
        self._initialized = True

        self._load_model()

    def _load_model(self):
        """加载 YOLO 模型"""
        if not ULTRALYTICS_AVAILABLE:
            error_msg = "Ultralytics library not installed. Run: pip install ultralytics"
            print(f"Error: {error_msg}")
            self.model_info.error = error_msg
            return

        try:
            # 确定实际使用的设备
            actual_device = self._get_device()

            # 尝试加载模型
            model_file = Path(self.model_path)
            if model_file.exists():
                print(f"Loading model from: {self.model_path}")
                self.model = YOLO(self.model_path)
            else:
                print(f"Model file not found at {self.model_path}, using pretrained yolov8n.pt")
                self.model = YOLO("yolov8n.pt")

            # 移动模型到设备
            self.model.to(actual_device)

            # 获取模型信息
            if hasattr(self.model, 'names'):
                self.model_info.class_names = list(self.model.names.values())
                self.model_info.num_classes = len(self.model.names)

            # 从路径中提取模型名称
            self.model_info.model_name = model_file.stem if model_file.exists() else "yolov8n"
            self.model_info.loaded = True
            self.model_info.device = actual_device
            self.model_info.load_time = datetime.now()

            # 预热模型
            self._warmup()

            print(f"Model loaded successfully: {self.model_info.model_name}")
            print(f"  - Classes: {self.model_info.num_classes}")
            print(f"  - Device: {actual_device}")

        except Exception as e:
            error_msg = f"Failed to load model: {str(e)}"
            print(f"Error: {error_msg}")
            self.model_info.error = error_msg
            self.model_info.loaded = False

    def _get_device(self) -> str:
        """获取可用的设备"""
        if self.device == "cuda":
            try:
                if torch and torch.cuda.is_available():
                    return "cuda"
            except:
                pass
            print(f"Warning: CUDA requested but not available, using CPU")
        return "cpu"

    def _warmup(self, img_size: int = 640):
        """预热模型"""
        if self.model is None:
            return

        try:
            dummy_frame = np.zeros((img_size, img_size, 3), dtype=np.uint8)
            self.model(dummy_frame, verbose=False)
        except Exception as e:
            print(f"Warning: Model warmup failed: {e}")

    def is_loaded(self) -> bool:
        """检查模型是否已加载"""
        return self.model is not None and self.model_info.loaded

    def get_model_info(self) -> ModelInfo:
        """获取模型信息"""
        return self.model_info

    def detect_frame(self, frame: np.ndarray) -> List[Detection]:
        """
        检测单帧图像中的目标

        Args:
            frame: BGR 格式的图像 numpy 数组

        Returns:
            Detection 列表
        """
        if self.model is None:
            return []

        try:
            results = self.model(
                frame,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                verbose=False
            )

            detections = []
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int)
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        cls_name = result.names[cls_id]

                        detections.append(Detection(
                            class_name=cls_name,
                            confidence=conf,
                            bbox=[int(x1), int(y1), int(x2), int(y2)],
                            timestamp=0.0,
                            frame_index=0,
                        ))

            return detections

        except Exception as e:
            print(f"Error in detect_frame: {e}")
            return []

    def detect_video(
        self,
        video_path: str,
        fps: float = 30.0,
        callback: Optional[Callable[[int, int, List[Detection]], None]] = None,
        skip_frames: int = 0
    ) -> List[Detection]:
        """
        检测视频中的目标

        Args:
            video_path: 视频文件路径
            fps: 视频帧率
            callback: 每帧处理完的回调函数 (frame_index, total_frames, detections)
            skip_frames: 跳帧数，用于加速处理

        Returns:
            所有检测结果的列表
        """
        if self.model is None:
            print("Error: Model not loaded")
            return []

        import cv2

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Cannot open video file: {video_path}")
            return []

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_index = 0
        processed_count = 0
        all_detections = []

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                # 跳帧处理
                if skip_frames > 0 and frame_index % (skip_frames + 1) != 0:
                    frame_index += 1
                    continue

                # 检测
                detections = self.detect_frame(frame)
                for det in detections:
                    det.timestamp = processed_count / fps if fps > 0 else 0
                    det.frame_index = frame_index

                all_detections.extend(detections)

                # 回调
                if callback:
                    try:
                        callback(frame_index, total_frames, detections)
                    except Exception as e:
                        print(f"Callback error: {e}")

                processed_count += 1
                frame_index += 1

        finally:
            cap.release()

        return all_detections

    def set_threshold(self, conf: float = None, iou: float = None):
        """设置检测阈值"""
        if conf is not None:
            self.conf_threshold = conf
        if iou is not None:
            self.iou_threshold = iou

    def reload(self, model_path: str = None, device: str = None):
        """重新加载模型"""
        if model_path:
            self.model_path = model_path
        if device:
            self.device = device

        self._initialized = False
        self.__init__(self.model_path, self.conf_threshold, self.iou_threshold, self.device)


# 全局检测器实例（延迟加载）
_detector: Optional[YOLODetector] = None


def get_detector(
    model_path: str = "yolov8n.pt",
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45,
    device: str = "cpu"
) -> YOLODetector:
    """
    获取全局检测器实例

    Args:
        model_path: 模型路径
        conf_threshold: 置信度阈值
        iou_threshold: IOU 阈值
        device: 设备 (cpu/cuda)

    Returns:
        YOLODetector 实例
    """
    global _detector
    if _detector is None:
        _detector = YOLODetector(model_path, conf_threshold, iou_threshold, device)
    return _detector


def check_model_status() -> Dict[str, Any]:
    """
    检查模型状态

    Returns:
        模型状态信息字典
    """
    global _detector
    if _detector is None:
        return {
            "loaded": False,
            "message": "Detector not initialized"
        }

    info = _detector.get_model_info()
    return {
        "loaded": info.loaded,
        "model_path": info.model_path,
        "model_name": info.model_name,
        "device": info.device,
        "num_classes": info.num_classes,
        "class_names": info.class_names,
        "error": info.error,
        "ultralytics_available": ULTRALYTICS_AVAILABLE
    }


if __name__ == "__main__":
    # 测试检测器
    print("=" * 50)
    print("YOLO Detector Test")
    print("=" * 50)

    status = check_model_status()
    print(f"Ultralytics available: {status['ultralytics_available']}")

    detector = get_detector()
    print(f"Model loaded: {detector.is_loaded()}")

    info = detector.get_model_info()
    print(f"\nModel Info:")
    print(f"  - Name: {info.model_name}")
    print(f"  - Path: {info.model_path}")
    print(f"  - Device: {info.device}")
    print(f"  - Classes: {info.num_classes}")
    print(f"  - Class Names: {info.class_names[:5]}..." if len(info.class_names) > 5 else f"  - Class Names: {info.class_names}")

    print("\n" + "=" * 50)
    print("Test complete")
    print("=" * 50)

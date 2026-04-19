from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from services.detector import get_detector, check_model_status, YOLODetector
from services.yolo_loader import get_model_manager

router = APIRouter(prefix="/model", tags=["model"])


class ModelStatusResponse(BaseModel):
    loaded: bool
    model_name: str
    model_path: str
    device: str
    num_classes: int
    class_names: List[str]
    error: Optional[str] = None


class ModelInfoResponse(BaseModel):
    model_name: str
    model_path: str
    type: str
    size: str


@router.get("/status", response_model=ModelStatusResponse)
def get_status():
    """获取当前模型状态"""
    # 确保检测器已初始化
    detector = get_detector()
    status = check_model_status()

    # 如果全局检测器未初始化但模型已加载，更新状态
    if not status.get("loaded") and detector.is_loaded():
        info = detector.get_model_info()
        return ModelStatusResponse(
            loaded=True,
            model_name=info.model_name,
            model_path=info.model_path,
            device=info.device,
            num_classes=info.num_classes,
            class_names=info.class_names,
            error=info.error
        )

    return ModelStatusResponse(
        loaded=status.get("loaded", False),
        model_name=status.get("model_name", ""),
        model_path=status.get("model_path", ""),
        device=status.get("device", "cpu"),
        num_classes=status.get("num_classes", 0),
        class_names=status.get("class_names", []),
        error=status.get("error")
    )


@router.get("/available", response_model=List[ModelInfoResponse])
def get_available_models():
    """获取可用模型列表"""
    manager = get_model_manager()
    models = manager.get_available_models()
    return [
        ModelInfoResponse(
            model_name=m["name"],
            model_path=m["path"],
            type=m["type"],
            size=m.get("size", "unknown")
        )
        for m in models
    ]


@router.get("/classes", response_model=List[str])
def get_classes():
    """获取当前数据集的类别列表"""
    manager = get_model_manager()
    return manager.get_classes()


class TrainRequest(BaseModel):
    model: str = "yolov8n.pt"
    epochs: int = 100
    batch: int = 16
    imgsz: int = 640
    device: str = "cpu"


class TrainResponse(BaseModel):
    message: str
    status: str


@router.post("/train", response_model=TrainResponse)
def train_model(request: TrainRequest):
    """触发模型训练"""
    manager = get_model_manager()

    try:
        results = manager.train(
            model=request.model,
            epochs=request.epochs,
            batch=request.batch,
            imgsz=request.imgsz,
            device=request.device
        )

        if results:
            return TrainResponse(
                message=f"Training complete. Model saved to {results.save_dir}/weights/best.pt",
                status="success"
            )
        else:
            return TrainResponse(
                message="Training failed",
                status="failed"
            )
    except Exception as e:
        return TrainResponse(
            message=f"Training error: {str(e)}",
            status="error"
        )


class ExportRequest(BaseModel):
    model_path: str
    format: str = "onnx"
    imgsz: int = 640


class ExportResponse(BaseModel):
    message: str
    exported_path: Optional[str] = None
    status: str


@router.post("/export", response_model=ExportResponse)
def export_model(request: ExportRequest):
    """导出训练好的模型"""
    manager = get_model_manager()

    try:
        exported_path = manager.export_model(
            model_path=request.model_path,
            format=request.format,
            imgsz=request.imgsz
        )

        if exported_path:
            return ExportResponse(
                message=f"Model exported successfully",
                exported_path=exported_path,
                status="success"
            )
        else:
            return ExportResponse(
                message="Export failed",
                status="failed"
            )
    except Exception as e:
        return ExportResponse(
            message=f"Export error: {str(e)}",
            status="error"
        )


class ReloadRequest(BaseModel):
    model_path: Optional[str] = None
    device: Optional[str] = None


class ReloadResponse(BaseModel):
    message: str
    status: str


@router.post("/reload", response_model=ReloadResponse)
def reload_model(request: ReloadRequest):
    """重新加载模型"""
    detector = get_detector()

    try:
        detector.reload(
            model_path=request.model_path,
            device=request.device if request.device else None
        )

        if detector.is_loaded():
            return ReloadResponse(
                message="Model reloaded successfully",
                status="success"
            )
        else:
            return ReloadResponse(
                message="Model reload failed",
                status="failed"
            )
    except Exception as e:
        return ReloadResponse(
            message=f"Reload error: {str(e)}",
            status="error"
        )

"""
YOLO 模型管理模块
用于训练、验证和模型管理
"""
from pathlib import Path
from typing import Optional, Dict, Any, List
import yaml

try:
    from ultralytics import YOLO
    ULTRALYTICS_AVAILABLE = True
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    YOLO = None


class YOLOModelManager:
    """YOLO 模型管理器"""

    def __init__(self, model_dir: str = "../yolo"):
        self.model_dir = Path(model_dir)
        self.models_dir = self.model_dir / "models"
        self.runs_dir = self.model_dir / "runs"
        self.data_yaml = self.model_dir / "data.yaml"

    def get_available_models(self) -> List[Dict[str, Any]]:
        """获取可用的模型列表"""
        models = []

        # 检查预训练模型
        pretrained = ["yolov8n.pt", "yolov8s.pt", "yolov8m.pt", "yolov8l.pt", "yolov8x.pt"]
        for name in pretrained:
            models.append({
                "name": name,
                "path": name,
                "type": "pretrained",
                "size": "nano"
            })

        # 检查训练输出目录
        if self.runs_dir.exists():
            train_dirs = list((self.runs_dir / "train").glob("*"))
            for dir in train_dirs:
                weights_dir = dir / "weights"
                if weights_dir.exists():
                    best_weight = weights_dir / "best.pt"
                    last_weight = weights_dir / "last.pt"

                    if best_weight.exists():
                        models.append({
                            "name": f"{dir.parent.name}/{dir.name} (best)",
                            "path": str(best_weight),
                            "type": "trained",
                            "size": self._get_model_size(best_weight)
                        })

        return models

    def _get_model_size(self, path: Path) -> str:
        """获取模型文件大小"""
        if path.exists():
            size_bytes = path.stat().st_size
            if size_bytes < 1024 * 1024:
                return f"{size_bytes / 1024:.1f} KB"
            elif size_bytes < 1024 * 1024 * 1024:
                return f"{size_bytes / (1024 * 1024):.1f} MB"
            else:
                return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
        return "Unknown"

    def get_classes(self) -> List[str]:
        """获取数据集中的类别列表"""
        if self.data_yaml.exists():
            with open(self.data_yaml, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
                return data.get("names", [])
        return []

    def set_classes(self, classes: List[str]):
        """设置数据集中的类别"""
        if self.data_yaml.exists():
            with open(self.data_yaml, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
        else:
            data = {"path": "./data", "train": "images/train", "val": "images/val"}

        data["names"] = classes
        data["nc"] = len(classes)

        with open(self.data_yaml, "w", encoding="utf-8") as f:
            yaml.dump(data, f, allow_unicode=True)

    def load_model(self, model_path: str = None, device: str = "cpu") -> Optional[Any]:
        """加载模型"""
        if not ULTRALYTICS_AVAILABLE:
            print("Error: Ultralytics not installed")
            return None

        try:
            if model_path is None:
                # 查找最佳训练模型
                best_path = self.runs_dir / "train" / "weights" / "best.pt"
                if best_path.exists():
                    model_path = str(best_path)
                else:
                    model_path = "yolov8n.pt"

            model = YOLO(model_path)
            model.to(device)
            return model

        except Exception as e:
            print(f"Error loading model: {e}")
            return None

    def train(
        self,
        data_config: str = None,
        model: str = "yolov8n.pt",
        epochs: int = 100,
        batch: int = 16,
        imgsz: int = 640,
        device: str = "cpu",
        project: str = None,
        name: str = "exp",
        exist_ok: bool = True,
        **kwargs
    ) -> Optional[Any]:
        """
        训练 YOLO 模型

        Args:
            data_config: 数据配置文件路径
            model: 预训练模型
            epochs: 训练轮数
            batch: 批次大小
            imgsz: 图像大小
            device: 训练设备
            project: 项目保存目录
            name: 实验名称
            **kwargs: 其他训练参数

        Returns:
            训练结果
        """
        if not ULTRALYTICS_AVAILABLE:
            print("Error: Ultralytics not installed")
            return None

        if data_config is None:
            data_config = str(self.data_yaml)

        if project is None:
            project = str(self.runs_dir / "train")

        try:
            print(f"Starting training...")
            print(f"  - Data: {data_config}")
            print(f"  - Model: {model}")
            print(f"  - Epochs: {epochs}")
            print(f"  - Device: {device}")

            model = YOLO(model)
            results = model.train(
                data=data_config,
                epochs=epochs,
                batch=batch,
                imgsz=imgsz,
                device=device,
                project=project,
                name=name,
                exist_ok=exist_ok,
                **kwargs
            )

            print(f"Training complete!")
            print(f"Best model saved to: {results.save_dir}/weights/best.pt")

            return results

        except Exception as e:
            print(f"Error during training: {e}")
            return None

    def export_model(
        self,
        model_path: str,
        format: str = "onnx",
        imgsz: int = 640,
        **kwargs
    ) -> Optional[str]:
        """
        导出模型

        Args:
            model_path: 模型路径
            format: 导出格式 (onnx/torchscript/tflite/etc.)
            imgsz: 图像大小

        Returns:
            导出的模型路径
        """
        if not ULTRALYTICS_AVAILABLE:
            print("Error: Ultralytics not installed")
            return None

        try:
            model = YOLO(model_path)
            exported_path = model.export(format=format, imgsz=imgsz, **kwargs)
            print(f"Model exported to: {exported_path}")
            return exported_path

        except Exception as e:
            print(f"Error exporting model: {e}")
            return None

    def validate(
        self,
        model_path: str,
        data_config: str = None,
        batch: int = 16,
        imgsz: int = 640,
        device: str = "cpu"
    ) -> Optional[Dict[str, Any]]:
        """
        验证模型性能

        Args:
            model_path: 模型路径
            data_config: 数据配置文件
            batch: 批次大小
            imgsz: 图像大小
            device: 设备

        Returns:
            验证指标
        """
        if not ULTRALYTICS_AVAILABLE:
            print("Error: Ultralytics not installed")
            return None

        if data_config is None:
            data_config = str(self.data_yaml)

        try:
            model = YOLO(model_path)
            results = model.val(
                data=data_config,
                batch=batch,
                imgsz=imgsz,
                device=device
            )

            metrics = {
                "mAP50": float(results.box.map50) if hasattr(results.box, 'map50') else None,
                "mAP50-95": float(results.box.map) if hasattr(results.box, 'map') else None,
                "precision": float(results.box.mp) if hasattr(results.box, 'mp') else None,
                "recall": float(results.box.mr) if hasattr(results.box, 'mr') else None,
            }

            return metrics

        except Exception as e:
            print(f"Error validating model: {e}")
            return None


# 全局实例
_model_manager: Optional[YOLOModelManager] = None


def get_model_manager(model_dir: str = "../yolo") -> YOLOModelManager:
    """获取模型管理器实例"""
    global _model_manager
    if _model_manager is None:
        _model_manager = YOLOModelManager(model_dir)
    return _model_manager


if __name__ == "__main__":
    print("=" * 50)
    print("YOLO Model Manager Test")
    print("=" * 50)

    manager = get_model_manager()

    print("\nAvailable models:")
    for model in manager.get_available_models():
        print(f"  - {model['name']} ({model['type']})")

    print(f"\nDataset classes: {manager.get_classes()}")

    print("\n" + "=" * 50)
    print("Test complete")
    print("=" * 50)

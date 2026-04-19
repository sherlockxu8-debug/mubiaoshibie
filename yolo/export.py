from ultralytics import YOLO
import argparse


def main():
    parser = argparse.ArgumentParser(description="Export YOLO model")
    parser.add_argument("--model", type=str, required=True, help="Path to model weights")
    parser.add_argument("--format", type=str, default="onnx", help="Export format (onnx/torchscript)")
    parser.add_argument("--imgsz", type=int, default=640, help="Image size")

    args = parser.parse_args()

    model = YOLO(args.model)

    model.export(format=args.format, imgsz=args.imgsz)

    print(f"Model exported successfully")


if __name__ == "__main__":
    main()

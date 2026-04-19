# 校园失物寻找系统 - Lost&Found

基于校园监控视频的失物检索小程序，帮助用户快速定位遗失物品的出现时间和地点。

## 功能概览

- **视频上传**：用户上传监控视频，标注摄像头编号
- **智能检测**：基于 YOLO 模型自动识别视频中的物品
- **地点关联**：通过摄像头编号查询对应安装地点
- **结果检索**：按物品名称、时间、地点搜索检测记录
- **模型训练**：支持使用自定义数据集微调 YOLO 模型

## 技术架构

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  微信小程序  │ ──▶ │   后端 API   │ ──▶ │  YOLO 检测  │
│  (用户端)   │     │  (FastAPI)  │     │   服务      │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   数据库     │
                    │  (存储结果)  │
                    └─────────────┘
```

## 目录结构

```
LostAndFound/
├── miniprogram/              # 微信小程序端
│   ├── pages/
│   │   ├── index/            # 首页（上传视频）
│   │   ├── history/         # 检测历史
│   │   ├── search/          # 搜索结果
│   │   └── camera/          # 摄像头管理
│   ├── utils/
│   └── app.js
│
├── server/                   # 后端服务
│   ├── api/                  # API 路由
│   │   ├── video.py          # 视频上传/处理
│   │   ├── result.py         # 检测结果查询
│   │   └── camera.py        # 摄像头管理
│   ├── models/               # 数据模型
│   ├── services/             # 业务逻辑
│   │   ├── detector.py      # YOLO 检测服务
│   │   └── video_processor.py
│   ├── utils/
│   └── main.py
│
├── yolo/                     # YOLO 模型相关
│   ├── train.py              # 训练脚本
│   ├── data/                 # 训练数据
│   │   ├── images/
│   │   └── labels/
│   ├── models/               # 模型配置
│   └── runs/                 # 训练输出
│
├── database/                 # 数据库相关
│   └── schema.sql            # 数据库表结构
│
└── config.yaml               # 配置文件
```

## 小程序端功能

| 页面 | 功能 |
|------|------|
| 首页 | 上传视频、选择摄像头、提交检测任务 |
| 检测历史 | 查看历史检测结果列表 |
| 搜索 | 按物品名称/时间/地点检索 |
| 摄像头管理 | 查看/添加摄像头编号与地点映射 |

## 后端 API

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/video/upload` | POST | 上传视频 |
| `/api/video/{id}/status` | GET | 查询处理状态 |
| `/api/result/` | GET | 获取检测结果列表 |
| `/api/result/{id}` | GET | 获取单条结果详情 |
| `/api/camera/` | GET/POST | 摄像头 CRUD |
| `/api/camera/list` | GET | 获取摄像头地点映射 |

## 数据库表

### videos
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| filename | TEXT | 文件名 |
| camera_id | TEXT | 摄像头编号 |
| status | TEXT | 处理状态 |
| created_at | DATETIME | 上传时间 |

### detection_results
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| video_id | INTEGER | 外键关联视频 |
| class_name | TEXT | 物品类别 |
| confidence | FLOAT | 置信度 |
| bbox | TEXT | 检测框坐标 |
| timestamp | FLOAT | 视频时间戳 |
| created_at | DATETIME | 检测时间 |

### cameras
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 摄像头编号 |
| location | TEXT | 安装地点 |
| description | TEXT | 描述 |

## YOLO 模型训练

```bash
cd yolo

# 1. 准备数据
# 将标注数据放入 data/images 和 data/labels

# 2. 修改 data.yaml 配置数据路径

# 3. 训练模型
python train.py --data data.yaml --model yolov8n.pt --epochs 100

# 4. 导出模型
python export.py --model runs/train/weights/best.pt --format onnx
```

## 环境配置

### 后端依赖
```
fastapi>=0.100
uvicorn
opencv-python
supervision
ultralytics
sqlalchemy
python-multipart
pyyaml
```

### 小程序配置
- 微信开发者工具
- 关联后端服务域名

## 快速启动

### 1. 启动后端
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. 配置小程序
在 `miniprogram/utils/config.js` 中设置后端 API 地址

### 3. 初始化数据库
```bash
cd database
sqlite3 lostandfound.db < schema.sql
```

## 开发说明

- 小程序仅提供上传、查询、展示功能
- 视频检测由后端异步处理
- YOLO 模型推理建议使用 GPU 加速

## License

MIT

# 校园失物寻找系统 - Lost&Found

基于校园监控视频的失物检索网页应用，帮助用户快速定位遗失物品的出现时间和地点。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![FastAPI](https://img.shields.io/badge/fastapi-0.100+-orange.svg)
![Vue](https://img.shields.io/badge/vue-3.4+-42b983.svg)
![ElementPlus](https://img.shields.io/badge/element--plus-2.0+-409eff.svg)

## 功能特性

- **视频上传**：拖拽或选择视频文件上传
- **智能检测**：基于 YOLOv8 模型自动识别视频中的物品
- **实时进度**：上传和检测进度实时显示
- **地点关联**：通过摄像头编号查询对应安装地点
- **结果检索**：按物品名称、置信度、时间筛选
- **摄像头管理**：完整的 CRUD 操作
- **模型训练**：支持使用自定义数据集微调 YOLO 模型

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Vue 3 + Element Plus | 现代化响应式网页 |
| 后端 | FastAPI + Python | 高性能 REST API |
| 检测 | YOLOv8 + OpenCV | 实时目标检测 |
| 数据库 | SQLite + SQLAlchemy | 轻量级关系数据库 |
| 异步处理 | asyncio | 视频后台处理 |

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      网页浏览器                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │  首页   │  │  历史   │  │  搜索   │  │ 摄像头  │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
└───────┼────────────┼────────────┼────────────┼───────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                         │ REST API
        ┌────────────────┴────────────────┐
        │         后端 FastAPI           │
        │  ┌─────────┐  ┌─────────────┐ │
        │  │ API路由 │  │ YOLO检测服务 │ │
        │  └────┬────┘  └──────┬──────┘ │
        │       │              │         │
        │  ┌────┴────┐   ┌─────┴─────┐  │
        │  │SQLAlchemy│   │异步处理器 │  │
        │  └────┬────┘   └─────┬─────┘  │
        └───────┼──────────────┼────────┘
                │              │
        ┌───────┴───────┐  ┌───┴────┐
        │    SQLite     │  │ YOLOv8 │
        │   Database    │  │ Model  │
        └───────────────┘  └────────┘
```

## 项目结构

```
LostAndFound/
├── frontend/                     # Vue.js 前端
│   ├── src/
│   │   ├── api/                 # API 请求封装
│   │   │   └── index.js         # API 接口
│   │   ├── components/          # 公共组件
│   │   │   └── common/
│   │   │       ├── AppHeader.vue
│   │   │       └── AppFooter.vue
│   │   ├── router/              # 路由配置
│   │   │   └── index.js
│   │   ├── views/               # 页面组件
│   │   │   ├── Index.vue        # 首页（视频上传）
│   │   │   ├── History.vue      # 检测历史
│   │   │   ├── Search.vue       # 搜索结果
│   │   │   └── Camera.vue       # 摄像头管理
│   │   ├── App.vue              # 根组件
│   │   └── main.js             # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # 后端服务
│   ├── main.py                  # FastAPI 入口
│   ├── config.yaml              # 配置文件
│   ├── requirements.txt         # Python 依赖
│   ├── api/                     # API 路由
│   │   ├── camera.py            # 摄像头 CRUD
│   │   ├── video.py            # 视频上传/处理
│   │   └── result.py            # 检测结果查询
│   ├── models/                  # 数据模型
│   │   ├── models.py            # SQLAlchemy ORM
│   │   └── schemas.py           # Pydantic 模型
│   └── services/                # 业务逻辑
│       ├── database.py          # 数据库连接
│       ├── detector.py          # YOLO 检测服务
│       └── video_processor.py   # 视频处理
│
├── yolo/                        # YOLO 模型
│   ├── train.py                 # 训练脚本
│   ├── export.py                # 模型导出
│   └── data.yaml                # 训练配置
│
├── database/                    # 数据库
│   └── schema.sql               # 表结构
│
└── README.md                    # 项目文档
```

## 快速开始

### 1. 环境要求

- Python 3.8+
- Node.js 18+
- SQLite
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 2. 启动后端

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

后端服务将在 http://localhost:8000 启动

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 功能演示

### 首页 - 视频上传

- 显示系统统计信息（摄像头数、视频数、检测结果数）
- 支持拖拽上传视频文件
- 选择对应摄像头
- 实时显示上传和检测进度
- 完成后自动跳转到结果页

### 历史记录

- 分页展示所有上传视频
- 支持按状态筛选（全部/等待中/处理中/已完成/失败）
- 点击跳转到对应视频的检测结果

### 搜索结果

- 输入物品名称关键词搜索
- 按摄像头筛选
- 按置信度筛选（30%/50%/70%/90%+）
- 置信度三色标识（高/中/低）

### 摄像头管理

- 列表展示所有摄像头
- 添加新摄像头（编号、地点、楼栋、楼层）
- 编辑现有摄像头信息
- 删除摄像头（二次确认）

## API 接口

### 摄像头接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/camera/` | GET | 获取摄像头列表 |
| `/api/camera/{id}` | GET | 获取单个摄像头 |
| `/api/camera/` | POST | 添加摄像头 |
| `/api/camera/{id}` | PUT | 更新摄像头 |
| `/api/camera/{id}` | DELETE | 删除摄像头 |

### 视频接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/video/upload` | POST | 上传视频 |
| `/api/video/` | GET | 获取视频列表 |
| `/api/video/{id}/status` | GET | 获取处理状态 |
| `/api/video/{id}/process` | POST | 手动触发处理 |

### 检测结果接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/result/` | GET | 搜索检测结果 |
| `/api/result/{id}` | GET | 获取单条结果 |

## 数据库表结构

### videos

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| filename | TEXT | 文件名 |
| file_path | TEXT | 存储路径 |
| camera_id | TEXT | 摄像头编号 |
| status | TEXT | 处理状态 |
| duration | FLOAT | 视频时长 |
| frame_count | INTEGER | 总帧数 |
| created_at | DATETIME | 创建时间 |

### detection_results

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| video_id | INTEGER | 外键 |
| class_name | TEXT | 物品类别 |
| confidence | FLOAT | 置信度 |
| bbox | TEXT | 检测框坐标 |
| timestamp | FLOAT | 视频时间戳 |
| frame_index | INTEGER | 帧序号 |
| created_at | DATETIME | 创建时间 |

### cameras

| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 摄像头编号（主键） |
| location | TEXT | 安装地点 |
| building | TEXT | 楼栋 |
| floor | INTEGER | 楼层 |
| description | TEXT | 描述 |
| status | TEXT | 状态 |
| created_at | DATETIME | 创建时间 |

## YOLO 模型训练

```bash
cd yolo

# 1. 准备数据
# 将标注数据放入 data/images 和 data/labels

# 2. 修改 data.yaml 配置数据路径和类别

# 3. 训练模型
python train.py --data data.yaml --model yolov8n.pt --epochs 100

# 4. 导出模型
python export.py --model runs/train/weights/best.pt --format onnx
```

### 预定义类别

- backpack（背包）
- phone（手机）
- wallet（钱包）
- keys（钥匙）
- book（书本）
- water_bottle（水杯）
- umbrella（雨伞）
- laptop（笔记本电脑）
- headphones（耳机）
- other（其他）

## 配置说明

### 后端配置 (server/config.yaml)

```yaml
database:
  path: "../database/lostandfound.db"

yolo:
  model_path: "../yolo/runs/train/weights/best.pt"
  conf_threshold: 0.25
  iou_threshold: 0.45
  device: "cuda"  # cuda 或 cpu

video:
  upload_dir: "../uploads/videos"
  max_size_mb: 500

app:
  host: "0.0.0.0"
  port: 8000
  debug: true
```

### 前端 API 配置 (frontend/src/api/index.js)

```javascript
const API_BASE = 'http://localhost:8000/api'
```

如需修改后端地址，编辑此文件即可。

## 开发说明

### 添加新页面

1. 在 `frontend/src/views/` 创建新的 Vue 组件
2. 在 `frontend/src/router/index.js` 中添加路由
3. 在 Header 组件中添加导航链接

### 添加新的 API 接口

1. 在 `server/api/` 目录创建路由文件
2. 在 `server/main.py` 中注册路由
3. 在 `frontend/src/api/index.js` 中添加调用方法

### 自定义检测类别

1. 修改 `yolo/data.yaml` 中的类别列表
2. 准备对应类别的标注数据
3. 重新训练模型
4. 更新 `server/services/detector.py` 中的类别映射

## 性能优化

- YOLO 推理建议使用 GPU 加速
- 大视频建议分段时间处理
- 数据库已建立索引优化查询

## 常见问题

**Q: 上传视频失败？**
A: 检查后端服务是否启动，确认 API 地址配置正确，查看后端控制台错误信息。

**Q: 检测结果为空？**
A: 确认视频中确实包含目标物品，可降低置信度阈值重试。

**Q: 处理速度慢？**
A: 使用 GPU 加速，或降低视频分辨率。

## License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 致谢

- [Ultralytics](https://ultralytics.com) - YOLO 模型
- [FastAPI](https://fastapi.tiangolo.com) - 后端框架
- [Vue.js](https://vuejs.org) - 前端框架
- [Element Plus](https://element-plus.org) - UI 组件库
- [SQLAlchemy](https://www.sqlalchemy.org) - ORM 工具

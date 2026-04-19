-- 校园失物寻找系统 - 数据库表结构
-- Lost&Found Database Schema

-- 1. 视频表 videos
CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    camera_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    duration FLOAT,
    frame_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 检测结果表 detection_results
CREATE TABLE IF NOT EXISTS detection_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    confidence FLOAT NOT NULL CHECK(confidence >= 0 AND confidence <= 1),
    bbox TEXT NOT NULL,
    timestamp FLOAT NOT NULL,
    frame_index INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- 3. 摄像头表 cameras
CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    building TEXT,
    floor INTEGER,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 索引优化
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_camera ON videos(camera_id);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_results_video ON detection_results(video_id);
CREATE INDEX IF NOT EXISTS idx_results_class ON detection_results(class_name);
CREATE INDEX IF NOT EXISTS idx_results_timestamp ON detection_results(timestamp);

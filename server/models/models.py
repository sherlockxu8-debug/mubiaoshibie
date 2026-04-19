from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"), nullable=False)
    status = Column(String(20), default="pending")
    duration = Column(Float, nullable=True)
    frame_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    camera = relationship("Camera", back_populates="videos")
    results = relationship(
        "DetectionResult", back_populates="video", cascade="all, delete-orphan"
    )


class DetectionResult(Base):
    __tablename__ = "detection_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    class_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    bbox = Column(Text, nullable=False)
    timestamp = Column(Float, nullable=False)
    frame_index = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="results")


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(50), primary_key=True)
    location = Column(String(200), nullable=False)
    building = Column(String(100), nullable=True)
    floor = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    videos = relationship("Video", back_populates="camera")

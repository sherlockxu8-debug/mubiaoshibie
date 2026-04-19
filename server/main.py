from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import camera, video, result
from services.database import init_db

app = FastAPI(
    title="Lost&Found API",
    description="校园失物寻找系统后端API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(camera.router, prefix="/api")
app.include_router(video.router, prefix="/api")
app.include_router(result.router, prefix="/api")


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {"message": "Lost&Found API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

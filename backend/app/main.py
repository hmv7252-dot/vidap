from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import init_db
from app.services.job_manager import job_manager
from app.services.storage import cleanup_old_files
from app.routes import health, users, credits, videos, generation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_video_generator")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    await init_db()
    logger.info("Starting background job queue worker...")
    job_manager.start_worker()
    logger.info("Running initial storage cleanup for files older than 24 hours...")
    cleanup_old_files()
    yield

app = FastAPI(
    title="AI Video Generator Backend",
    description="Open-Source Image-to-Video FastAPI Service powered by PyTorch and CUDA",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Frontend & Mobile/Capacitor clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(health.router)
app.include_router(users.router)
app.include_router(credits.router)
app.include_router(generation.router)
app.include_router(videos.router)

# Safe Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception during {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred while processing the request."}
    )

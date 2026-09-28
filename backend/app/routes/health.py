from fastapi import APIRouter
from app.models.database_models import HealthResponse
from app.services.video_generator import video_generator
from app.services.job_manager import job_manager
from app.config import MODEL_ID

router = APIRouter(prefix="/api", tags=["health"])

@router.get("/health", response_model=HealthResponse)
async def check_health():
    return HealthResponse(
        status="ok",
        gpu_available=video_generator.is_gpu_available(),
        gpu_name=video_generator.get_gpu_name(),
        model_loaded=video_generator.is_loaded(),
        model_name=MODEL_ID,
        active_jobs=job_manager.get_active_job_count()
    )

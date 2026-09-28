from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.models.database_models import GenerateResponse, JobStatusResponse
from app.services.storage import save_uploaded_image
from app.services.credit_manager import CreditManager
from app.services.job_manager import job_manager
from app.services.video_generator import video_generator
from app.database import get_or_create_user

router = APIRouter(prefix="/api", tags=["generation"])

@router.post("/generate", response_model=GenerateResponse)
async def generate_video(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    duration: int = Form(3),
    aspect_ratio: str = Form("9:16"),
    resolution: Optional[str] = Form("576x1024"),
    device_id: str = Form(...)
):
    # Validation
    cleaned_prompt = prompt.strip()
    if not cleaned_prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    if duration not in [3, 5, 8]:
        duration = 3

    if aspect_ratio not in ["9:16", "16:9", "1:1"]:
        aspect_ratio = "9:16"

    # Pre-flight GPU check
    if not video_generator.is_gpu_available():
        raise HTTPException(
            status_code=503,
            detail="GPU server is required for AI video generation. NVIDIA CUDA device unavailable."
        )

    # User & Credit verification
    user = await get_or_create_user(device_id)
    user_id = user["user_id"]

    # Reserve credit (transactional, refunds if generation fails)
    credit_type = await CreditManager.reserve_credit(user_id)

    # Secure image upload
    try:
        saved_image_path = await save_uploaded_image(image)
    except Exception as e:
        # Refund credit if image save/validation fails
        await CreditManager.refund_credit(user_id, credit_type)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Failed to process image: {e}")

    # Submit to queue
    job_id = await job_manager.submit_job(
        user_id=user_id,
        image_path=saved_image_path,
        prompt=cleaned_prompt,
        negative_prompt=negative_prompt.strip() if negative_prompt else None,
        duration=duration,
        aspect_ratio=aspect_ratio,
        resolution=resolution,
        credit_type=credit_type
    )

    return GenerateResponse(
        job_id=job_id,
        status="queued",
        message="Video queued for generation. Waiting for GPU."
    )

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def get_generation_status(job_id: str):
    job = job_manager.get_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return JobStatusResponse(
        job_id=job["job_id"],
        status=job["status"],
        progress=job["progress"],
        message=job["message"],
        video_url=job.get("video_url"),
        thumbnail_url=job.get("thumbnail_url"),
        error=job.get("error")
    )

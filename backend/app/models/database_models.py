from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    gpu_available: bool
    gpu_name: Optional[str] = None
    model_loaded: bool
    model_name: str
    active_jobs: int

class UserRegisterRequest(BaseModel):
    device_id: str = Field(..., min_length=4, max_length=128)

class UserProfileResponse(BaseModel):
    user_id: int
    device_id: str
    free_credits: int
    paid_credits: int
    total_credits: int
    daily_free_available: bool
    created_at: str

class GenerationRequestParams(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    negative_prompt: Optional[str] = None
    duration: int = Field(default=3, description="Duration in seconds: 3, 5, or 8")
    aspect_ratio: str = Field(default="9:16", description="9:16, 16:9, or 1:1")
    resolution: Optional[str] = Field(default="576x1024", description="Model supported resolution")

class GenerateResponse(BaseModel):
    job_id: str
    status: str
    message: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str  # queued | processing | completed | failed
    progress: int
    message: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error: Optional[str] = None

class GenerationHistoryItem(BaseModel):
    id: int
    job_id: str
    prompt: str
    status: str
    video_url: Optional[str]
    thumbnail_url: Optional[str]
    created_at: str
    completed_at: Optional[str]

class RewardedAdClaimRequest(BaseModel):
    device_id: str
    ad_network_verification_token: str

class PaymentPackage(BaseModel):
    id: str
    credits: int
    name: str
    description: str
    price_cents: int
    currency: str

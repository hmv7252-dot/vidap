import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Server
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# AI Model settings
MODEL_ID = os.getenv("MODEL_ID", "stabilityai/stable-video-diffusion-img2vid-xt")
MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", "1"))

# Credit System
INITIAL_FREE_CREDITS = int(os.getenv("INITIAL_FREE_CREDITS", "3"))
DAILY_FREE_CREDITS = int(os.getenv("DAILY_FREE_CREDITS", "1"))

# Storage & Files
MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
STORAGE_CLEANUP_HOURS = int(os.getenv("STORAGE_CLEANUP_HOURS", "24"))

UPLOADS_DIR = BASE_DIR / "uploads"
GENERATED_DIR = BASE_DIR / "generated"
DATABASE_PATH = BASE_DIR / "app_data.db"

# Ensure directories exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

# Rate limiting
GENERATION_COOLDOWN_SECONDS = 5
MAX_JOBS_PER_USER_QUEUED = 2

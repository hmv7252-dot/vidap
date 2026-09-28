import os
import time
import uuid
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image
from app.config import (
    UPLOADS_DIR,
    GENERATED_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    ALLOWED_MIME_TYPES,
    STORAGE_CLEANUP_HOURS
)

def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    try:
        resolved = target_path.resolve()
        return base_dir.resolve() in resolved.parents or resolved == base_dir.resolve()
    except Exception:
        return False

def sanitize_filename(filename: str) -> str:
    clean = re.sub(r'[^a-zA-Z0-9_\.-]', '_', filename)
    return clean

async def save_uploaded_image(file: UploadFile) -> Path:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. Supported: JPG, PNG, WEBP."
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image size exceeds 20MB maximum limit ({len(content)} bytes)."
        )

    # Validate image integrity with PIL
    import io
    try:
        img = Image.open(io.BytesIO(content))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")

    ext = Path(file.filename or "upload.png").suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".png"

    file_id = f"{uuid.uuid4().hex}{ext}"
    target_path = UPLOADS_DIR / file_id

    with open(target_path, "wb") as f:
        f.write(content)

    return target_path

def get_video_file_path(filename: str) -> Path:
    safe_name = sanitize_filename(filename)
    target_path = GENERATED_DIR / safe_name
    if not is_safe_path(GENERATED_DIR, target_path) or not target_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found.")
    return target_path

def cleanup_old_files():
    cutoff = time.time() - (STORAGE_CLEANUP_HOURS * 3600)
    for directory in [UPLOADS_DIR, GENERATED_DIR]:
        for item in directory.glob("*"):
            if item.is_file():
                try:
                    if item.stat().st_mtime < cutoff:
                        item.unlink()
                except Exception:
                    pass

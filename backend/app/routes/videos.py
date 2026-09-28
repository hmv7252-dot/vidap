from fastapi import APIRouter
from fastapi.responses import FileResponse
from app.services.storage import get_video_file_path

router = APIRouter(prefix="/api/video", tags=["videos"])

@router.get("/{filename}")
async def serve_video(filename: str):
    file_path = get_video_file_path(filename)
    suffix = file_path.suffix.lower()
    if suffix == ".mp4":
        media_type = "video/mp4"
    elif suffix in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif suffix == ".png":
        media_type = "image/png"
    else:
        media_type = "application/octet-stream"

    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=file_path.name
    )

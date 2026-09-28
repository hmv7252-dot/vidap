from fastapi import APIRouter, HTTPException
from typing import List
import aiosqlite
from app.models.database_models import UserRegisterRequest, UserProfileResponse, GenerationHistoryItem
from app.database import get_or_create_user
from app.config import DATABASE_PATH

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/profile", response_model=UserProfileResponse)
async def get_user_profile(body: UserRegisterRequest):
    user_data = await get_or_create_user(body.device_id)
    return UserProfileResponse(**user_data)

@router.get("/history/{device_id}", response_model=List[GenerationHistoryItem])
async def get_user_history(device_id: str):
    async with aiosqlite.connect(DATABASE_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT id FROM users WHERE device_id = ?", (device_id,))
        user = await cursor.fetchone()
        if not user:
            return []

        user_id = user["id"]
        cursor = await db.execute("""
            SELECT id, job_id, prompt, status, video_path, thumbnail_path, created_at, completed_at
            FROM generations
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 50
        """, (user_id,))
        rows = await cursor.fetchall()

        items = []
        for row in rows:
            v_path = row["video_path"]
            t_path = row["thumbnail_path"]
            from pathlib import Path
            v_url = f"/api/video/{Path(v_path).name}" if v_path else None
            t_url = f"/api/video/{Path(t_path).name}" if t_path else None

            items.append(GenerationHistoryItem(
                id=row["id"],
                job_id=row["job_id"],
                prompt=row["prompt"],
                status=row["status"],
                video_url=v_url,
                thumbnail_url=t_url,
                created_at=str(row["created_at"]),
                completed_at=str(row["completed_at"]) if row["completed_at"] else None
            ))
        return items

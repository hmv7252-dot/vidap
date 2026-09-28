import asyncio
import uuid
import time
from pathlib import Path
from typing import Dict, Any, Optional
import aiosqlite

from app.config import MAX_CONCURRENT_JOBS, DATABASE_PATH
from app.services.video_generator import video_generator
from app.services.credit_manager import CreditManager

class JobStatus:
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class JobManager:
    def __init__(self):
        # In-memory fast status lookup
        self.jobs: Dict[str, Dict[str, Any]] = {}
        # Concurrency semaphore to prevent VRAM crashes
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT_JOBS)
        self.queue: asyncio.Queue = asyncio.Queue()
        self.worker_task: Optional[asyncio.Task] = None

    def start_worker(self):
        if self.worker_task is None or self.worker_task.done():
            self.worker_task = asyncio.create_task(self._process_queue())

    async def submit_job(
        self,
        user_id: int,
        image_path: Path,
        prompt: str,
        negative_prompt: Optional[str],
        duration: int,
        aspect_ratio: str,
        resolution: Optional[str],
        credit_type: str
    ) -> str:
        job_id = str(uuid.uuid4())
        job_info = {
            "job_id": job_id,
            "user_id": user_id,
            "image_path": str(image_path),
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "duration": duration,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "credit_type": credit_type,
            "status": JobStatus.QUEUED,
            "progress": 5,
            "message": "Waiting for GPU...",
            "video_url": None,
            "thumbnail_url": None,
            "error": None,
            "created_at": time.time()
        }
        self.jobs[job_id] = job_info

        # Persist in DB
        async with aiosqlite.connect(DATABASE_PATH) as db:
            await db.execute("""
                INSERT INTO generations (
                    user_id, job_id, prompt, negative_prompt,
                    aspect_ratio, duration, status, credit_used
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            """, (user_id, job_id, prompt, negative_prompt, aspect_ratio, duration, JobStatus.QUEUED))
            await db.commit()

        await self.queue.put(job_id)
        return job_id

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    def get_active_job_count(self) -> int:
        return sum(1 for j in self.jobs.values() if j["status"] in [JobStatus.QUEUED, JobStatus.PROCESSING])

    async def _process_queue(self):
        while True:
            job_id = await self.queue.get()
            job = self.jobs.get(job_id)
            if not job:
                self.queue.task_done()
                continue

            async with self.semaphore:
                await self._execute_generation_job(job)
            self.queue.task_done()

    async def _execute_generation_job(self, job: Dict[str, Any]):
        job_id = job["job_id"]
        user_id = job["user_id"]
        credit_type = job["credit_type"]
        image_path = Path(job["image_path"])

        try:
            job["status"] = JobStatus.PROCESSING
            job["progress"] = 15
            job["message"] = "Preparing AI model..."

            # Ensure model is ready
            loop = asyncio.get_event_loop()
            if not video_generator.is_loaded():
                job["progress"] = 25
                job["message"] = "Loading open-source image-to-video model into GPU VRAM..."
                await loop.run_in_executor(None, video_generator.load_model)

            job["progress"] = 40
            job["message"] = "Generating video frames on NVIDIA GPU..."

            # Generate video in background thread to avoid blocking event loop
            video_filename = f"gen_{job_id}.mp4"
            video_path, thumb_path = await loop.run_in_executor(
                None,
                video_generator.generate_video,
                image_path,
                job["prompt"],
                job["negative_prompt"],
                job["duration"],
                job["aspect_ratio"],
                job["resolution"],
                video_filename
            )

            job["progress"] = 85
            job["message"] = "Rendering video..."
            await asyncio.sleep(0.5)

            job["progress"] = 95
            job["message"] = "Finalizing..."

            video_url = f"/api/video/{video_path.name}"
            thumb_url = f"/api/video/{thumb_path.name}"

            job["status"] = JobStatus.COMPLETED
            job["progress"] = 100
            job["message"] = "Video ready!"
            job["video_url"] = video_url
            job["thumbnail_url"] = thumb_url

            # Finalize credit deduction in database
            await CreditManager.finalize_credit_deduction(user_id, credit_type)

            # Update DB generation record
            async with aiosqlite.connect(DATABASE_PATH) as db:
                await db.execute("""
                    UPDATE generations
                    SET status = ?, video_path = ?, thumbnail_path = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE job_id = ?
                """, (JobStatus.COMPLETED, str(video_path), str(thumb_path), job_id))
                await db.commit()

        except Exception as e:
            print(f"[Job {job_id}] Generation failed: {e}")
            job["status"] = JobStatus.FAILED
            job["progress"] = 0
            job["message"] = "Generation failed"
            job["error"] = str(e)

            # Refund reserved credit!
            await CreditManager.refund_credit(user_id, credit_type)

            async with aiosqlite.connect(DATABASE_PATH) as db:
                await db.execute("""
                    UPDATE generations
                    SET status = ?, completed_at = CURRENT_TIMESTAMP
                    WHERE job_id = ?
                """, (JobStatus.FAILED, job_id))
                await db.commit()

job_manager = JobManager()

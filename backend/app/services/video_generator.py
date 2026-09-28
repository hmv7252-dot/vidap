import os
import torch
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import imageio
from app.config import MODEL_ID, GENERATED_DIR

class LocalVideoGenerator:
    _instance = None
    _pipeline = None

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_loaded = False
        self.load_error: Optional[str] = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def is_gpu_available(self) -> bool:
        return torch.cuda.is_available()

    def get_gpu_name(self) -> Optional[str]:
        if torch.cuda.is_available():
            return torch.cuda.get_device_name(0)
        return None

    def is_loaded(self) -> bool:
        return self.model_loaded and self._pipeline is not None

    def load_model(self):
        """
        Loads the official Hugging Face diffusers Stable Video Diffusion model once into GPU VRAM.
        """
        if self.is_loaded():
            return

        if not self.is_gpu_available():
            self.load_error = "GPU server is required for AI video generation. CUDA device not found."
            return

        try:
            from diffusers import StableVideoDiffusionPipeline

            print(f"[AI Model] Loading {MODEL_ID} on {self.device} with float16 precision...")
            pipeline = StableVideoDiffusionPipeline.from_pretrained(
                MODEL_ID,
                torch_dtype=torch.float16,
                variant="fp16",
            )
            # Use model CPU offload for optimal VRAM efficiency (works on 12GB - 24GB GPUs)
            if hasattr(pipeline, "enable_model_cpu_offload"):
                pipeline.enable_model_cpu_offload()
            else:
                pipeline.to("cuda")

            self._pipeline = pipeline
            self.model_loaded = True
            self.load_error = None
            print(f"[AI Model] Successfully loaded {MODEL_ID} into GPU memory.")
        except Exception as e:
            self.load_error = str(e)
            print(f"[AI Model] Failed to load model: {e}")
            raise RuntimeError(f"Failed to load AI model: {e}")

    def prepare_input_image(
        self,
        image_path: Path,
        target_size: Tuple[int, int]
    ) -> Image.Image:
        """
        Resizes and center-crops the input image to match the exact dimensions
        expected by the image-to-video diffusion model.
        """
        img = Image.open(image_path).convert("RGB")
        target_w, target_h = target_size

        # Aspect ratio resize and crop
        img_ratio = img.width / img.height
        target_ratio = target_w / target_h

        if img_ratio > target_ratio:
            # Image is wider: fit height and crop width
            new_h = target_h
            new_w = int(target_h * img_ratio)
        else:
            # Image is taller: fit width and crop height
            new_w = target_w
            new_h = int(target_w / img_ratio)

        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        cropped = resized.crop((left, top, left + target_w, top + target_h))
        return cropped

    def generate_video(
        self,
        image_path: Path,
        prompt: str,
        negative_prompt: Optional[str] = None,
        duration: int = 3,
        aspect_ratio: str = "9:16",
        resolution: Optional[str] = None,
        output_filename: Optional[str] = None
    ) -> Tuple[Path, Path]:
        """
        Runs the actual AI video generation on NVIDIA GPU.
        Returns (video_mp4_path, thumbnail_image_path).
        """
        if not self.is_gpu_available():
            raise RuntimeError("GPU server is required for AI video generation.")

        if not self.is_loaded():
            self.load_model()

        if self._pipeline is None:
            raise RuntimeError(f"AI Model is not loaded. Error: {self.load_error}")

        # Map aspect ratio to model supported dimensions
        # SVD XT natively generates at 1024x576 or 576x1024 (multiples of 64)
        if aspect_ratio == "16:9":
            target_size = (1024, 576)
        elif aspect_ratio == "1:1":
            target_size = (576, 576)
        else:  # 9:16 default
            target_size = (576, 1024)

        # Prepare and crop image
        input_image = self.prepare_input_image(image_path, target_size)

        # Frame count and FPS calculation
        # SVD XT model generates 25 frames
        num_frames = 25
        if duration == 3:
            fps = 8
        elif duration == 5:
            fps = 5
        else:
            fps = 4

        # Motion bucket calculation based on prompt keywords
        motion_bucket_id = 127
        p_lower = prompt.lower()
        if "fast" in p_lower or "run" in p_lower or "explosive" in p_lower:
            motion_bucket_id = 180
        elif "slow" in p_lower or "gentle" in p_lower or "calm" in p_lower:
            motion_bucket_id = 70

        print(f"[AI Video] Generating {num_frames} frames ({aspect_ratio}, {target_size[0]}x{target_size[1]}) on GPU...")

        with torch.inference_mode():
            generator = torch.manual_seed(42)
            # Run diffusion pipeline
            output = self._pipeline(
                input_image,
                decode_chunk_size=4,
                generator=generator,
                motion_bucket_id=motion_bucket_id,
                noise_aug_strength=0.05,
                num_frames=num_frames,
            )
            frames = output.frames[0]

        # Generate paths
        video_name = output_filename or f"video_{Path(image_path).stem}.mp4"
        thumb_name = f"{Path(video_name).stem}_thumb.jpg"

        video_path = GENERATED_DIR / video_name
        thumb_path = GENERATED_DIR / thumb_name

        # Save first frame as thumbnail
        if len(frames) > 0:
            frames[0].save(thumb_path, "JPEG", quality=90)

        # Export frames to MP4 using imageio ffmpeg writer with h264 codec for universal mobile compatibility
        writer = imageio.get_writer(
            str(video_path),
            fps=fps,
            codec="libx264",
            pixelformat="yuv420p",
            format="FFMPEG"
        )
        for frame in frames:
            writer.append_data(imageio.core.util.Array(frame))
        writer.close()

        print(f"[AI Video] Video exported successfully to {video_path}")
        return video_path, thumb_path

video_generator = LocalVideoGenerator.get_instance()

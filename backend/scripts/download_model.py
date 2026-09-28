"""
Model Downloader Script for Stable Video Diffusion
Downloads and caches the official Hugging Face weights.
"""

import sys
import os
import torch

try:
    from diffusers import StableVideoDiffusionPipeline
except ImportError:
    print("Error: diffusers is not installed. Please run: pip install -r requirements.txt")
    sys.exit(1)

MODEL_ID = os.getenv("MODEL_ID", "stabilityai/stable-video-diffusion-img2vid-xt")

def download_model():
    print(f"Starting download of model: {MODEL_ID}")
    print("Checking CUDA availability...")
    if torch.cuda.is_available():
        print(f"GPU detected: {torch.cuda.get_device_name(0)}")
    else:
        print("Warning: No CUDA device detected. Downloading weights for later GPU execution.")

    try:
        pipe = StableVideoDiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            variant="fp16" if torch.cuda.is_available() else None,
        )
        print("Model downloaded and cached successfully!")
        return 0
    except Exception as e:
        print(f"Failed to download model weights: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(download_model())

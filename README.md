# AI Image-to-Video Generator

A complete, production-grade, open-source AI Image-to-Video generation platform featuring:
- **Mobile-First Client** (Android Jetpack Compose Native App & Capacitor-ready Web Frontend)
- **High-Throughput GPU Backend** (Python 3.11, FastAPI, PyTorch, NVIDIA CUDA)
- **Real Open-Source Image-to-Video Model**: Powered by [Stability AI's Stable Video Diffusion XT](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt) (25 frames, H.264 MP4 export).
- **Zero Commercial API Dependencies**: No Gemini, Grok, Runway, Kling, or Pika API keys required. All inference runs locally on dedicated NVIDIA GPU hardware.
- **Fair Credit System**: 3 initial free video credits for new devices, +1 daily replenishment, transactional reservation/refund on failure, and modular payment & rewarded ad abstractions.

---

## 1. Architecture

```text
+------------------------------------+
|  Android Native / Web Frontend    |  (Port: 5173 / Android APK)
|  - Jetpack Compose / React 18      |
|  - Image upload, prompt, settings  |
+-----------------+------------------+
                  | HTTP (Multipart / JSON)
                  v
+-----------------+------------------+
|  Python FastAPI Backend            |  (Port: 8000)
|  - Asynchronous Job Queue          |
|  - SQLite User & Credit Store      |
|  - Rate Limiting & Storage Purge   |
+-----------------+------------------+
                  | PyTorch CUDA
                  v
+-----------------+------------------+
|  NVIDIA GPU (CUDA 12.1)            |
|  - Stable Video Diffusion XT       |  (Inference in float16)
|  - ffmpeg H.264 Video Rendering    |
+-----------------+------------------+
                  |
                  v
+-----------------+------------------+
|  Generated MP4 Video               |  (Temporary 24h retention)
|  Served via /api/video/{filename}  |
+------------------------------------+
```

---

## 2. Model Specifications & Licensing

- **Model Name:** Stable Video Diffusion XT (`stabilityai/stable-video-diffusion-img2vid-xt`)
- **Official Repository:** [Hugging Face diffusers](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt)
- **License:** [Stability AI Non-Commercial Research Community License](https://huggingface.co/stabilityai/stable-video-diffusion-img2vid-xt/blob/main/LICENSE)
- **Commercial Restrictions:** Research/Personal community use permitted. Commercial deployment requires commercial licensing agreement with Stability AI.
- **Hardware Requirements:**
  - **GPU:** NVIDIA GPU with CUDA compute capability 7.0+ (RTX 3060, RTX 3080, RTX 4090, A10G, L4, or A100).
  - **VRAM:** Minimum 12 GB VRAM (using `enable_model_cpu_offload()` in float16). 16GB–24GB recommended for optimal inference speed.
  - **Disk Space:** ~10 GB for model weights and PyTorch/CUDA dependencies.

---

## 3. Local Development Setup

### A. Python GPU Backend

1. **Clone repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment (Python 3.11 recommended):**
   - **Linux / macOS:**
     ```bash
     python3.11 -m venv .venv
     source .venv/bin/activate
     ```
   - **Windows:**
     ```powershell
     python -m venv .venv
     .venv\Scripts\activate
     ```

3. **Install PyTorch with CUDA support:**
   ```bash
   pip install --upgrade pip
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
   pip install -r requirements.txt
   ```

4. **Verify GPU availability & download model weights:**
   ```bash
   python scripts/download_model.py
   ```

5. **Start the FastAPI server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

6. **Verify server health:**
   Open [http://localhost:8000/api/health](http://localhost:8000/api/health) in your browser:
   ```json
   {
     "status": "ok",
     "gpu_available": true,
     "gpu_name": "NVIDIA GeForce RTX ...",
     "model_loaded": true,
     "model_name": "stabilityai/stable-video-diffusion-img2vid-xt",
     "active_jobs": 0
   }
   ```

---

### B. React / Web Frontend

1. **Navigate to `frontend/`:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. **Open frontend in your browser:** [http://localhost:5173](http://localhost:5173)

The frontend configuration resides in `frontend/src/config.ts`:
```typescript
export const API_BASE_URL = "http://localhost:8000";
```

---

### C. Android Native App (Jetpack Compose)

The Android app communicates directly with the Python GPU server:
- **In Android Emulator:** Default address is configured to `http://10.0.2.2:8000` (which routes to `localhost:8000` on the host machine).
- **On Physical Phone:**
  1. Connect your phone and PC to the same Wi-Fi network.
  2. Find your PC's local LAN IP (e.g. `192.168.1.100`).
  3. Open the app, tap the **Settings** tab, update the server URL to `http://192.168.1.100:8000`, and tap **Test Server Connection**.

---

## 4. Docker Deployment with NVIDIA GPU

Ensure [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) is installed on the host.

```bash
docker compose up --build -d
```

Check logs:
```bash
docker logs -f ai_video_backend
```

---

## 5. Security & Privacy Highlights

1. **Path Traversal Protection:** All file reads and writes are validated using canonical path containment.
2. **24-Hour File Purging:** All uploaded user images and generated MP4 videos are automatically deleted after 24 hours.
3. **No Secret Leaks:** Internal stack traces and server file system paths are sanitized from public API responses.
4. **Credit Protection:** Credit reservation is atomic. If GPU inference fails or aborts, the reserved credit is immediately refunded.

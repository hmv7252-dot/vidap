# GPU Server Deployment & Operation Guide

This guide details setting up the Python FastAPI image-to-video backend on a machine or cloud instance equipped with an NVIDIA GPU (e.g. AWS EC2 G5/G6, RunPod, Lambda Labs, Paperspace, or local workstation).

---

## 1. NVIDIA Driver & CUDA Compatibility

The video generation model runs on **PyTorch 2.2+ with CUDA 12.1+**.
Your host machine must have an NVIDIA GPU driver installed that supports CUDA 12.0 or higher (Driver version 525.60.13+ on Linux or 528.33+ on Windows).

### Verifying with `nvidia-smi`
Run in terminal:
```bash
nvidia-smi
```
Expected output:
```text
+-----------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03             Driver Version: 535.129.03     CUDA Version: 12.2     |
|-----------------------------------------+------------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id          Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |           Memory-Usage | GPU-Util  Compute M. |
|=========================================+========================+======================|
|   0  NVIDIA GeForce RTX 4090        Off |   00000000:01:00.0 Off |                  N/A |
| 31%   35C    P8             18W /  450W |       2MiB /  24564MiB |      0%      Default |
+-----------------------------------------+------------------------+----------------------+
```

---

## 2. Docker & NVIDIA Container Toolkit Setup

To run inside Docker with GPU passthrough:

1. **Install Docker Engine:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Install NVIDIA Container Toolkit:**
   ```bash
   curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
     && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
       sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
       sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
   sudo apt-get update
   sudo apt-get install -y nvidia-container-toolkit
   sudo nvidia-ctk runtime configure --runtime=docker
   sudo systemctl restart docker
   ```

3. **Verify GPU access inside Docker:**
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.1.1-base-ubuntu22.04 nvidia-smi
   ```
   If this outputs your GPU details, GPU passthrough is working properly.

---

## 3. Manual Server Setup (Without Docker)

1. **Create Virtual Environment:**
   ```bash
   cd backend
   python3.11 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install PyTorch with CUDA 12.1:**
   ```bash
   pip install --upgrade pip
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
   pip install -r requirements.txt
   ```

3. **Pre-download Model Weights:**
   ```bash
   python scripts/download_model.py
   ```
   This caches Stable Video Diffusion XT weights into `~/.cache/huggingface/hub/`.

4. **Start the FastAPI Service:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1
   ```
   *Note:* Set `--workers 1` because PyTorch GPU inference pipelines should be managed through the async job queue rather than multiple multi-process workers competing for VRAM.

---

## 4. Connecting Clients (Web & Android)

### Local Development / Same Machine
- Web Frontend: uses `http://localhost:8000`
- Android Emulator: uses `http://10.0.2.2:8000`

### Physical Phone / Home Wi-Fi
1. Find your server PC's private LAN IP (`ip a` or `ipconfig`), e.g., `192.168.1.50`.
2. Ensure port 8000 is open in firewall:
   ```bash
   sudo ufw allow 8000/tcp
   ```
3. In the Android app, go to **Settings** and set the base URL to `http://192.168.1.50:8000`.

### Cloud GPU Server / Remote Domain
When deployed to a remote cloud VPS with a public IP or reverse proxy (e.g. Nginx, Cloudflare Tunnel, or Caddy):
1. Configure SSL/TLS termination on domain (e.g. `https://api.yourdomain.com`).
2. Update `frontend/src/config.ts` or the Android app Settings tab with `https://api.yourdomain.com`.

---

## 5. Free Notebook GPU Limitations Notice

If you are testing on free or shared cloud notebooks (such as Google Colab, Kaggle, or free tier instances):
- **Session Lifetimes:** Free notebook instances typically disconnect after idle periods or 4–12 hours.
- **Dynamic Public IPs:** Tunnels like ngrok or localtunnel will assign new URLs every session restart.
- **Resource Constraints:** Free tiers may offer GPUs with 12GB–16GB VRAM (e.g. T4). Stable Video Diffusion XT requires fp16 offloading on 16GB GPUs to avoid Out-Of-Memory (OOM) errors.
- For stable production use, a persistent dedicated instance with an RTX 3080/4080/4090 or A10G/L4 with at least 16GB–24GB VRAM is strongly recommended.

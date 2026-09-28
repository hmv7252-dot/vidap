import { API_BASE_URL } from "../config";

export function getDeviceId(): string {
  const STORAGE_KEY = "ai_video_device_id";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = "dev_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export interface HealthInfo {
  status: string;
  gpu_available: boolean;
  gpu_name: string | null;
  model_loaded: boolean;
  model_name: string;
  active_jobs: number;
}

export interface UserProfile {
  user_id: number;
  device_id: string;
  free_credits: number;
  paid_credits: number;
  total_credits: number;
  daily_free_available: boolean;
  created_at: string;
}

export interface GenerationHistoryItem {
  id: number;
  job_id: string;
  prompt: string;
  status: string;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PaymentPackage {
  id: string;
  credits: number;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  video_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
}

export const api = {
  async getHealth(): Promise<HealthInfo> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) throw new Error("Backend server unreachable");
    return res.json();
  },

  async getUserProfile(deviceId: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id: deviceId }),
    });
    if (!res.ok) throw new Error("Failed to load user profile");
    return res.json();
  },

  async getUserHistory(deviceId: string): Promise<GenerationHistoryItem[]> {
    const res = await fetch(`${API_BASE_URL}/api/users/history/${deviceId}`);
    if (!res.ok) throw new Error("Failed to load history");
    return res.json();
  },

  async getCreditPackages(): Promise<PaymentPackage[]> {
    const res = await fetch(`${API_BASE_URL}/api/credits/packages`);
    if (!res.ok) throw new Error("Failed to load credit packages");
    return res.json();
  },

  async getAdConfig(): Promise<{ rewarded_ads_enabled: boolean; reward_credits_per_view: number }> {
    const res = await fetch(`${API_BASE_URL}/api/credits/ad-config`);
    if (!res.ok) return { rewarded_ads_enabled: false, reward_credits_per_view: 1 };
    return res.json();
  },

  async generateVideo(data: {
    imageFile: File;
    prompt: string;
    negativePrompt?: string;
    duration: number;
    aspectRatio: string;
    deviceId: string;
  }): Promise<{ job_id: string; status: string; message: string }> {
    const formData = new FormData();
    formData.append("image", data.imageFile);
    formData.append("prompt", data.prompt);
    if (data.negativePrompt) formData.append("negative_prompt", data.negativePrompt);
    formData.append("duration", data.duration.toString());
    formData.append("aspect_ratio", data.aspectRatio);
    formData.append("device_id", data.deviceId);

    const res = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Generation request failed" }));
      throw new Error(err.detail || "Generation request failed");
    }
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/api/status/${jobId}`);
    if (!res.ok) throw new Error("Failed to fetch job status");
    return res.json();
  },

  getVideoFullUrl(pathOrUrl: string): string {
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    return `${API_BASE_URL}${pathOrUrl}`;
  }
};

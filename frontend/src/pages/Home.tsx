import React, { useState, useEffect, useRef } from "react";
import { Sparkles, AlertCircle, Video, Server, RefreshCw } from "lucide-react";
import { ImageUploader } from "../components/ImageUploader";
import { PromptBox } from "../components/PromptBox";
import { VideoSettings } from "../components/VideoSettings";
import { GenerationProgress } from "../components/GenerationProgress";
import { VideoResult } from "../components/VideoResult";
import { AdBanner } from "../components/AdBanner";
import { api, HealthInfo, UserProfile, getDeviceId } from "../services/api";

interface HomeProps {
  userProfile: UserProfile | null;
  healthInfo: HealthInfo | null;
  onRefreshProfile: () => void;
  onRefreshHealth: () => void;
}

export const Home: React.FC<HomeProps> = ({
  userProfile,
  healthInfo,
  onRefreshProfile,
  onRefreshHealth,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState(3);
  const [aspectRatio, setAspectRatio] = useState("9:16");

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobMessage, setJobMessage] = useState("");
  const [jobError, setJobError] = useState<string | null>(null);
  const [completedVideoUrl, setCompletedVideoUrl] = useState<string | null>(null);
  const [completedThumbUrl, setCompletedThumbUrl] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollIntervalRef = useRef<any>(null);

  // Polling logic for Job Queue
  useEffect(() => {
    if (!activeJobId) return;

    const poll = async () => {
      try {
        const res = await api.getJobStatus(activeJobId);
        setJobStatus(res.status);
        setJobProgress(res.progress);
        setJobMessage(res.message);

        if (res.status === "completed") {
          clearInterval(pollIntervalRef.current);
          setCompletedVideoUrl(res.video_url ? api.getVideoFullUrl(res.video_url) : null);
          setCompletedThumbUrl(res.thumbnail_url ? api.getVideoFullUrl(res.thumbnail_url) : null);
          onRefreshProfile();
        } else if (res.status === "failed") {
          clearInterval(pollIntervalRef.current);
          setJobError(res.error || "Generation encountered an error.");
          onRefreshProfile();
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [activeJobId]);

  const handleGenerate = async () => {
    setValidationError(null);
    setJobError(null);

    // Pre-flight checks per Section 9
    if (!imageFile) {
      setValidationError("Please upload an image first.");
      return;
    }
    if (!prompt.trim()) {
      setValidationError("Please enter a motion prompt describing how the video should move.");
      return;
    }
    if (!healthInfo) {
      setValidationError("Backend server is offline. Please start FastAPI at http://localhost:8000.");
      return;
    }
    if (!healthInfo.gpu_available) {
      setValidationError("NVIDIA GPU is required on the backend for open-source AI video generation.");
      return;
    }
    if (!userProfile || (userProfile.free_credits <= 0 && userProfile.paid_credits <= 0)) {
      setValidationError("You have 0 video credits remaining. Please check the Credits tab.");
      return;
    }

    try {
      setIsSubmitting(true);
      setJobStatus("queued");
      setJobProgress(5);
      setJobMessage("Uploading image...");
      setCompletedVideoUrl(null);

      const deviceId = getDeviceId();
      const res = await api.generateVideo({
        imageFile,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        duration,
        aspectRatio,
        deviceId,
      });

      setActiveJobId(res.job_id);
    } catch (err: any) {
      setValidationError(err.message || "Failed to start generation.");
      setJobStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewGeneration = () => {
    setActiveJobId(null);
    setJobStatus(null);
    setJobProgress(0);
    setCompletedVideoUrl(null);
    setCompletedThumbUrl(null);
    setJobError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Video className="w-7 h-7 text-indigo-400" />
          AI Image to Video
        </h1>
        <p className="text-sm text-slate-400 font-medium">
          Turn your image into an AI video
        </p>
      </div>

      {/* Backend Status Alert if GPU / Server unavailable */}
      {!healthInfo ? (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold">Local GPU Backend Not Detected</p>
              <p className="text-amber-400/80 text-[11px] mt-0.5">
                Ensure Python FastAPI is running at <code className="bg-slate-900 px-1 py-0.5 rounded">http://localhost:8000</code>.
              </p>
            </div>
          </div>
          <button
            onClick={onRefreshHealth}
            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded-lg flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : !healthInfo.gpu_available ? (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <p className="font-semibold">GPU server is required for AI video generation.</p>
            <p className="text-rose-300/80 text-[11px] mt-0.5">
              PyTorch detected no active CUDA device on the server.
            </p>
          </div>
        </div>
      ) : null}

      {/* Completed Video Result */}
      {completedVideoUrl ? (
        <VideoResult
          videoUrl={completedVideoUrl}
          thumbnailUrl={completedThumbUrl}
          onGenerateAgain={handleResetForNewGeneration}
        />
      ) : activeJobId ? (
        /* Progress Box */
        <GenerationProgress
          progress={jobProgress}
          status={jobStatus || "queued"}
          message={jobMessage}
          error={jobError}
        />
      ) : (
        /* Input Form */
        <div className="space-y-5 bg-slate-950/40 border border-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
          {/* Image Uploader */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              1. Source Image
            </label>
            <ImageUploader
              imageFile={imageFile}
              onImageSelected={setImageFile}
            />
          </div>

          {/* Prompt Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              2. Animation Prompt
            </label>
            <PromptBox
              prompt={prompt}
              onPromptChange={setPrompt}
              negativePrompt={negativePrompt}
              onNegativePromptChange={setNegativePrompt}
            />
          </div>

          {/* Video Settings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              3. Generation Settings
            </label>
            <VideoSettings
              duration={duration}
              onDurationChange={setDuration}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
            />
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleGenerate}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Sparkles className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Generate Video</span>
          </button>
        </div>
      )}

      {/* Ad Banner Abstraction */}
      <AdBanner />
    </div>
  );
};

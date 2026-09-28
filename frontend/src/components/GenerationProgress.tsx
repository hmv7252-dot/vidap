import React from "react";
import { Loader2, Cpu, CheckCircle2, AlertCircle } from "lucide-react";

interface GenerationProgressProps {
  progress: number;
  status: string;
  message: string;
  error?: string | null;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  status,
  message,
  error,
}) => {
  const steps = [
    { label: "Uploading image...", min: 0 },
    { label: "Preparing AI model...", min: 15 },
    { label: "Waiting for GPU...", min: 25 },
    { label: "Generating video...", min: 40 },
    { label: "Rendering video...", min: 85 },
    { label: "Finalizing...", min: 95 },
    { label: "Video ready!", min: 100 },
  ];

  return (
    <div className="w-full bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl space-y-5 animate-pulse-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {status === "failed" ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : status === "completed" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              {status === "failed"
                ? "Generation Failed"
                : status === "completed"
                ? "Generation Complete"
                : "AI Video Generation in Progress"}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">{message}</p>
          </div>
        </div>
        <span className="text-sm font-mono font-bold text-indigo-400">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${
            status === "failed"
              ? "bg-rose-500"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
          }`}
          style={{ width: `${Math.max(5, progress)}%` }}
        />
      </div>

      {/* Generation Steps Timeline */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
        {steps.slice(0, 4).map((step, idx) => {
          const isPassed = progress >= step.min;
          return (
            <div
              key={idx}
              className={`p-2 rounded-lg border text-center transition ${
                isPassed
                  ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300 font-medium"
                  : "bg-slate-950/40 border-slate-800 text-slate-500"
              }`}
            >
              {step.label}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
          <p className="font-semibold mb-0.5">Error Details:</p>
          <p>{error}</p>
          <p className="mt-1 text-slate-400">Your video credit was automatically refunded.</p>
        </div>
      )}

      {status !== "failed" && status !== "completed" && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Generating with NVIDIA GPU acceleration • Stable Video Diffusion XT</span>
        </div>
      )}
    </div>
  );
};

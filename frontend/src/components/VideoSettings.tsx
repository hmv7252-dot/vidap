import React from "react";
import { Sliders, Clock, Smartphone, Monitor, Square } from "lucide-react";

interface VideoSettingsProps {
  duration: number;
  onDurationChange: (val: number) => void;
  aspectRatio: string;
  onAspectRatioChange: (val: string) => void;
}

export const VideoSettings: React.FC<VideoSettingsProps> = ({
  duration,
  onDurationChange,
  aspectRatio,
  onAspectRatioChange,
}) => {
  const getModelResolution = (ratio: string) => {
    switch (ratio) {
      case "16:9":
        return "1024 × 576 (Landscape)";
      case "1:1":
        return "576 × 576 (Square)";
      default:
        return "576 × 1024 (Portrait)";
    }
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-slate-300">
          <Sliders className="w-4 h-4 text-indigo-400" /> Video Settings
        </span>
        <span className="text-[11px] text-indigo-400/80 normal-case font-normal">
          Model: SVD-XT (25 Frames)
        </span>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[3, 5, 8].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onDurationChange(sec)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                duration === sec
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {sec} seconds
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "9:16", label: "9:16", icon: Smartphone, desc: "Mobile" },
            { id: "16:9", label: "16:9", icon: Monitor, desc: "Widescreen" },
            { id: "1:1", label: "1:1", icon: Square, desc: "Square" },
          ].map(({ id, label, icon: Icon, desc }) => (
            <button
              key={id}
              type="button"
              onClick={() => onAspectRatioChange(id)}
              className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition flex flex-col items-center gap-1 ${
                aspectRatio === id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className="text-[10px] opacity-75 font-normal">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actual Model Output Resolution */}
      <div className="pt-1 flex items-center justify-between text-xs bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/80">
        <span className="text-slate-400">Native Model Resolution:</span>
        <span className="font-mono text-slate-200 font-medium">
          {getModelResolution(aspectRatio)}
        </span>
      </div>
    </div>
  );
};

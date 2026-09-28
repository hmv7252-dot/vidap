import React, { useRef } from "react";
import { Download, Share2, RotateCcw, Check } from "lucide-react";

interface VideoResultProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  onGenerateAgain: () => void;
}

export const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  thumbnailUrl,
  onGenerateAgain,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `ai_video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My AI Generated Video",
          text: "Check out this AI video I generated!",
          url: videoUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy link or trigger download
      try {
        await navigator.clipboard.writeText(videoUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        handleDownload();
      }
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Video Generated
        </h3>
        <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium">
          MP4 • H.264
        </span>
      </div>

      {/* Video Player */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center max-h-[480px]">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={thumbnailUrl || undefined}
          controls
          autoPlay
          loop
          playsInline
          className="w-full h-auto max-h-[460px] object-contain rounded-2xl"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5 pt-2">
        <button
          onClick={handleDownload}
          className="py-3 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/25"
        >
          <Download className="w-4 h-4" /> Download
        </button>

        <button
          onClick={handleShare}
          className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          {copied ? "Link Copied" : "Share"}
        </button>

        <button
          onClick={onGenerateAgain}
          className="py-3 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-600/25"
        >
          <RotateCcw className="w-4 h-4" /> Generate Again
        </button>
      </div>
    </div>
  );
};

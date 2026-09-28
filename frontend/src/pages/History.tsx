import React, { useEffect, useState } from "react";
import { Download, Play, Clock, Video, RefreshCw, AlertCircle } from "lucide-react";
import { api, GenerationHistoryItem, getDeviceId } from "../services/api";

export const History: React.FC = () => {
  const [items, setItems] = useState<GenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getUserHistory(getDeviceId());
      setItems(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-400" />
            Generation History
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your recent AI video generations (retained for 24 hours)
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Video Modal if selected */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-lg w-full space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">Video Preview</span>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>
            <video
              src={selectedVideo}
              controls
              autoPlay
              loop
              className="w-full max-h-[480px] rounded-2xl bg-black"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading history...</div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Video className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No generations yet</p>
          <p className="text-xs text-slate-500">
            Generate your first AI video on the Home screen to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const videoUrl = item.video_url ? api.getVideoFullUrl(item.video_url) : null;
            const thumbUrl = item.thumbnail_url ? api.getVideoFullUrl(item.thumbnail_url) : null;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center justify-between"
              >
                {/* Thumbnail / Status */}
                <div
                  onClick={() => videoUrl && setSelectedVideo(videoUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative flex items-center justify-center ${
                    videoUrl ? "cursor-pointer group" : ""
                  }`}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="w-6 h-6 text-slate-600" />
                  )}

                  {videoUrl && (
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition">
                      <Play className="w-6 h-6 text-white fill-white opacity-80 group-hover:scale-110 transition" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                    "{item.prompt}"
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>•</span>
                    <span
                      className={`font-semibold capitalize ${
                        item.status === "completed"
                          ? "text-emerald-400"
                          : item.status === "failed"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {videoUrl && (
                  <div className="shrink-0 flex items-center gap-1">
                    <a
                      href={videoUrl}
                      download
                      className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl transition"
                      title="Download MP4"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

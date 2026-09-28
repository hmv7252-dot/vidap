import React, { useState, useEffect } from "react";
import { Video, History as HistoryIcon, Zap, Shield, Activity, RefreshCw } from "lucide-react";
import { Home } from "./pages/Home";
import { History } from "./pages/History";
import { Credits } from "./pages/Credits";
import { CreditDisplay } from "./components/CreditDisplay";
import { api, HealthInfo, UserProfile, getDeviceId } from "./services/api";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"home" | "history" | "credits" | "privacy">("home");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchProfile = async () => {
    try {
      const data = await api.getUserProfile(getDeviceId());
      setUserProfile(data);
    } catch (err) {
      console.warn("Could not fetch user profile:", err);
    }
  };

  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealthInfo(data);
    } catch (err) {
      setHealthInfo(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.allSettled([fetchHealth(), fetchProfile()]);
      setLoadingInitial(false);
    };
    init();

    // Check health every 15s
    const timer = setInterval(fetchHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div
            onClick={() => setCurrentTab("home")}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">
                AI Video Generator
              </span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    healthInfo?.gpu_available
                      ? "bg-emerald-400 animate-pulse"
                      : healthInfo
                      ? "bg-amber-400"
                      : "bg-rose-500"
                  }`}
                />
                <span className="text-slate-400">
                  {healthInfo?.gpu_available
                    ? `GPU: ${healthInfo.gpu_name || "NVIDIA Active"}`
                    : healthInfo
                    ? "Backend Connected (No GPU)"
                    : "Backend Offline"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CreditDisplay
              freeCredits={userProfile?.free_credits ?? 0}
              paidCredits={userProfile?.paid_credits ?? 0}
              dailyFreeAvailable={userProfile?.daily_free_available ?? false}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {currentTab === "home" && (
          <Home
            userProfile={userProfile}
            healthInfo={healthInfo}
            onRefreshProfile={fetchProfile}
            onRefreshHealth={fetchHealth}
          />
        )}
        {currentTab === "history" && <History />}
        {currentTab === "credits" && (
          <Credits
            userProfile={userProfile}
            onRefreshProfile={fetchProfile}
          />
        )}
        {currentTab === "privacy" && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs text-slate-300">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" /> Privacy Policy
            </h2>
            <p className="leading-relaxed">
              <strong>Uploaded Images:</strong> Photos and artwork uploaded for video generation are processed strictly to compute motion latent vectors on the local GPU. Images are stored securely in temporary storage and are never sold or shared.
            </p>
            <p className="leading-relaxed">
              <strong>Temporary Storage:</strong> Generated videos and uploaded images are automatically deleted from server disks after 24 hours.
            </p>
            <p className="leading-relaxed">
              <strong>Anonymous Device ID:</strong> To avoid mandatory logins and minimize data collection, an anonymous installation ID is stored locally to maintain your credit balance and generation history.
            </p>
            <p className="leading-relaxed">
              <strong>No Cloud Model Logging:</strong> Model execution occurs strictly on private GPU hardware running open-source model weights (Stable Video Diffusion). No image data is sent to external commercial AI platforms.
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation for Mobile & Quick Tabs */}
      <nav className="sticky bottom-0 z-40 bg-slate-950/90 backdrop-blur-lg border-t border-slate-800/80 py-2 px-4">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            onClick={() => setCurrentTab("home")}
            className={`py-2 px-1 flex flex-col items-center gap-1 rounded-xl transition ${
              currentTab === "home"
                ? "text-indigo-400 font-bold bg-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-4 h-4" />
            <span className="text-[11px]">Generate</span>
          </button>

          <button
            onClick={() => setCurrentTab("history")}
            className={`py-2 px-1 flex flex-col items-center gap-1 rounded-xl transition ${
              currentTab === "history"
                ? "text-indigo-400 font-bold bg-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HistoryIcon className="w-4 h-4" />
            <span className="text-[11px]">History</span>
          </button>

          <button
            onClick={() => setCurrentTab("credits")}
            className={`py-2 px-1 flex flex-col items-center gap-1 rounded-xl transition ${
              currentTab === "credits"
                ? "text-indigo-400 font-bold bg-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[11px]">Credits</span>
          </button>

          <button
            onClick={() => setCurrentTab("privacy")}
            className={`py-2 px-1 flex flex-col items-center gap-1 rounded-xl transition ${
              currentTab === "privacy"
                ? "text-indigo-400 font-bold bg-indigo-500/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="text-[11px]">Privacy</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;

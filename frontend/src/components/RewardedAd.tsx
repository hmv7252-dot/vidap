import React, { useState } from "react";
import { PlayCircle, Gift } from "lucide-react";
import { AdProvider, NullAdProvider } from "./AdBanner";

interface RewardedAdProps {
  provider?: AdProvider;
  onRewardClaimed: (token: string) => Promise<void>;
}

export const RewardedAd: React.FC<RewardedAdProps> = ({
  provider = NullAdProvider,
  onRewardClaimed,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // If no ad provider is configured, HIDE "Watch Ad +1 Credit" per specification
  if (!provider.isConfigured()) {
    return null;
  }

  const handleWatchAd = async () => {
    try {
      setLoading(true);
      setStatusMsg(null);
      const res = await provider.showRewarded();
      if (res.success && res.token) {
        await onRewardClaimed(res.token);
        setStatusMsg("Reward verified: +1 Video Credit added!");
      } else {
        setStatusMsg("Ad view was not completed.");
      }
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to show rewarded ad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Gift className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-100">Watch Ad for Free Credit</p>
          <p className="text-[11px] text-slate-400">Earn +1 Video Credit upon completion</p>
          {statusMsg && <p className="text-[10px] text-amber-400 mt-0.5">{statusMsg}</p>}
        </div>
      </div>

      <button
        onClick={handleWatchAd}
        disabled={loading}
        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
      >
        <PlayCircle className="w-4 h-4" />
        {loading ? "Loading..." : "Watch Ad"}
      </button>
    </div>
  );
};

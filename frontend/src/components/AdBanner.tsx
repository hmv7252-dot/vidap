import React from "react";

export interface AdProvider {
  isConfigured: () => boolean;
  showBanner: () => void;
  showInterstitial: () => Promise<boolean>;
  showRewarded: () => Promise<{ success: boolean; token?: string }>;
}

export const NullAdProvider: AdProvider = {
  isConfigured: () => false,
  showBanner: () => {},
  showInterstitial: async () => false,
  showRewarded: async () => ({ success: false }),
};

export const AdBanner: React.FC<{ provider?: AdProvider }> = ({
  provider = NullAdProvider,
}) => {
  if (!provider.isConfigured()) {
    // If no ad provider is configured, do not render intrusive placeholder banners
    return null;
  }

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center my-3">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
        Sponsored
      </span>
      <div className="h-14 bg-slate-950 rounded-lg flex items-center justify-center text-xs text-slate-400">
        Ad Banner Unit
      </div>
    </div>
  );
};

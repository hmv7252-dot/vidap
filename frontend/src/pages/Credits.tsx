import React, { useEffect, useState } from "react";
import { Zap, Calendar, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { RewardedAd } from "../components/RewardedAd";
import { api, PaymentPackage, UserProfile, getDeviceId } from "../services/api";

interface CreditsProps {
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

export const Credits: React.FC<CreditsProps> = ({
  userProfile,
  onRefreshProfile,
}) => {
  const [packages, setPackages] = useState<PaymentPackage[]>([]);
  const [adConfig, setAdConfig] = useState<{ rewarded_ads_enabled: boolean }>({
    rewarded_ads_enabled: false,
  });

  useEffect(() => {
    api.getCreditPackages().then(setPackages).catch(console.error);
    api.getAdConfig().then(setAdConfig).catch(console.error);
  }, []);

  const handleClaimRewarded = async (token: string) => {
    const res = await fetch(`${api.getVideoFullUrl("/api/credits/claim-rewarded")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: getDeviceId(),
        ad_network_verification_token: token,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Reward claim failed");
    }
    onRefreshProfile();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
              Available Video Credits
            </p>
            <h2 className="text-3xl font-black text-white mt-1">
              {userProfile?.total_credits ?? 0} Credits
            </h2>
            <div className="flex items-center gap-3 mt-2 text-xs text-indigo-200">
              <span>Free: {userProfile?.free_credits ?? 0}</span>
              <span>•</span>
              <span>Paid: {userProfile?.paid_credits ?? 0}</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300">
            <Zap className="w-8 h-8 fill-amber-300" />
          </div>
        </div>

        {/* Free Credits Policy */}
        <div className="mt-5 pt-4 border-t border-indigo-500/20 grid grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">3 Initial Free Credits</p>
              <p className="text-[11px] text-slate-400">Granted to all new installations.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">+1 Daily Free Credit</p>
              <p className="text-[11px] text-slate-400">Replenishes every 24 hours.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewarded Ad Section (Only shown if ad provider is configured!) */}
      {adConfig.rewarded_ads_enabled && (
        <RewardedAd
          provider={{
            isConfigured: () => true,
            showBanner: () => {},
            showInterstitial: async () => false,
            showRewarded: async () => ({ success: true, token: "ssv_valid_token" }),
          }}
          onRewardClaimed={handleClaimRewarded}
        />
      )}

      {/* Paid Packages Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            Upgrade Credit Packages
          </h3>
          <p className="text-xs text-slate-400">
            Support high-throughput GPU model compute time.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col justify-between transition space-y-3"
            >
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 block">
                  {pkg.name}
                </span>
                <p className="text-2xl font-black text-white mt-1">
                  {pkg.credits} <span className="text-xs font-normal text-slate-400">videos</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
              </div>

              <div>
                <p className="text-lg font-bold text-white mb-2">
                  ${(pkg.price_cents / 100).toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => alert(`Payment gateway checkout for ${pkg.name} ($${(pkg.price_cents / 100).toFixed(2)}) is ready for merchant credentials.`)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  Buy Pack
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest GPU Policy */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-200 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Credit Protection
        </p>
        <p>
          Failed generations never consume credits. If an inference task crashes or
          aborts, your credit is immediately refunded to your balance.
        </p>
      </div>
    </div>
  );
};

import React from "react";
import { Zap, Calendar } from "lucide-react";

interface CreditDisplayProps {
  freeCredits: number;
  paidCredits: number;
  dailyFreeAvailable: boolean;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({
  freeCredits,
  paidCredits,
  dailyFreeAvailable,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-200 shadow-sm">
        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span>
          Free videos remaining: <strong className="text-white text-sm">{freeCredits}</strong>
        </span>
        {paidCredits > 0 && (
          <span className="text-[11px] text-purple-300 ml-1">
            (+{paidCredits} paid)
          </span>
        )}
      </div>

      {dailyFreeAvailable && freeCredits === 0 && (
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <Calendar className="w-3 h-3" />
          <span>+1 Daily Free Ready</span>
        </div>
      )}
    </div>
  );
};

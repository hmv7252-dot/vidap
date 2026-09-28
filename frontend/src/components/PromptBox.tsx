import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface PromptBoxProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
}

const SAMPLE_PROMPTS = [
  "Create realistic cinematic motion. The subject moves naturally, subtle camera pan, soft atmospheric lighting.",
  "Smooth gentle camera zoom in, breeze blowing through hair and fabric, vibrant natural lighting.",
  "Slow-motion cinematic drone sweep, gradual dynamic perspective change, hyper-realistic reflections.",
  "Person turns slightly towards camera with a subtle warm smile, authentic fluid movement, 4K depth of field."
];

export const PromptBox: React.FC<PromptBoxProps> = ({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
}) => {
  const [showNegative, setShowNegative] = useState(false);

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-400" /> Motion Prompt
        </label>
        <span className="text-xs text-slate-500">{prompt.length}/1000</span>
      </div>

      <div className="relative">
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Describe how you want the image to move..."
          className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Quick Example Suggestions */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-slate-400">Quick suggestions:</p>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onPromptChange(sample)}
              className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-slate-700/60 transition truncate max-w-full text-left"
            >
              {sample.substring(0, 45)}...
            </button>
          ))}
        </div>
      </div>

      {/* Negative Prompt Collapsible */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowNegative(!showNegative)}
          className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition font-medium"
        >
          {showNegative ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Optional Negative Prompt
        </button>

        {showNegative && (
          <div className="mt-2 animate-fadeIn">
            <textarea
              rows={2}
              value={negativePrompt}
              onChange={(e) => onNegativePromptChange(e.target.value)}
              placeholder="distorted face, extra fingers, extra limbs, duplicate person, warped body, flickering, blurry, unnatural motion"
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const StatCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  accent = "downy", // "downy" | "melrose" | "jonquil" | "rose"
  trend,
  trendType = "neutral", // "up" | "down" | "neutral"
}) => {
  // Top hairline gradient accent matching brand tokens
  const topAccent = {
    downy: "from-teal-400 via-emerald-500 to-transparent",
    melrose: "from-indigo-400 via-purple-500 to-transparent",
    jonquil: "from-amber-400 via-yellow-500 to-transparent",
    rose: "from-rose-400 via-red-500 to-transparent",
  }[accent] || "from-teal-400 via-emerald-500 to-transparent";

  const iconColor = {
    downy: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    melrose: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    jonquil: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  }[accent] || "text-teal-400 bg-teal-500/10 border-teal-500/20";

  return (
    <div className="group relative overflow-hidden rounded-xl bg-[#0D121D]/80 backdrop-blur-md border border-white/[0.07] p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.4)] transition-all duration-300 hover:border-white/[0.14] hover:-translate-y-0.5">
      {/* Precision hairline top accent rule */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${topAccent} opacity-70 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2.5">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-white">
              {value}
            </h3>
            {subvalue && (
              <span className="text-xs font-normal text-slate-400">
                {subvalue}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border shrink-0 transition-transform group-hover:scale-105 ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            {trendType === "up" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                {trend}
              </span>
            )}
            {trendType === "down" && (
              <span className="flex items-center gap-1 text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
                {trend}
              </span>
            )}
            {trendType === "neutral" && (
              <span className="flex items-center gap-1 text-slate-400">
                <Minus className="w-3.5 h-3.5" />
                {trend}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

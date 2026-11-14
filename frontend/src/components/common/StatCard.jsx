import React from "react";

export const StatCard = ({
  title,
  value,
  subvalue,
  icon: Icon,
  accent = "downy", // "downy" | "melrose" | "jonquil" | "rose"
  trend,
  trendType = "neutral", // "up" | "down" | "neutral"
}) => {
  const accentGlow = {
    downy: "border-downy/20 hover:border-downy/50 shadow-downy/5",
    melrose: "border-melrose/20 hover:border-melrose/50 shadow-melrose/5",
    jonquil: "border-jonquil/20 hover:border-jonquil/50 shadow-jonquil/5",
    rose: "border-rose-500/20 hover:border-rose-500/50 shadow-rose-500/5",
  }[accent] || "border-charcoal-border";

  const iconAccent = {
    downy: "bg-downy/10 text-downy border-downy/20",
    melrose: "bg-melrose/10 text-melrose border-melrose/20",
    jonquil: "bg-jonquil/10 text-[#bfd948] border-jonquil/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  }[accent] || "bg-charcoal-elevated text-alice";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-charcoal-card p-5 border transition-all duration-300 hover:-translate-y-0.5 shadow-lg ${accentGlow}`}
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-white/[0.03] to-transparent rounded-bl-full pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-alice-muted">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-alice">
              {value}
            </h3>
            {subvalue && (
              <span className="text-xs font-normal text-alice-muted">
                {subvalue}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${iconAccent}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          <span
            className={
              trendType === "up"
                ? "text-downy"
                : trendType === "down"
                ? "text-rose-400"
                : "text-alice-muted"
            }
          >
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

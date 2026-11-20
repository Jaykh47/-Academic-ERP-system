import React from "react";

export const Badge = ({ variant = "default", children, className = "" }) => {
  // Bespoke micro-status pill design: crisp hairline border, micro-pip, mono tracking
  const variantStyles = {
    // Brand precision teal
    downy: "bg-teal-500/10 text-teal-300 border-teal-500/25",
    // Soft indigo / iris
    melrose: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
    // High-visibility amber / jonquil
    jonquil: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    // Alice neutral
    alice: "bg-white/[0.04] text-slate-200 border-white/10",
    // Live Success
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
    // Warning
    warning: "bg-amber-500/10 text-amber-300 border-amber-500/25",
    // Danger / Shortage / Fail
    danger: "bg-rose-500/10 text-rose-300 border-rose-500/25",
    // Neutral Slate
    neutral: "bg-slate-800/60 text-slate-300 border-white/[0.07]",
    // Grade O / Outstanding
    gradeO: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold",
    gradeA: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold",
    gradeB: "bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold",
    gradeF: "bg-rose-500/15 text-rose-300 border-rose-500/30 font-bold",
  };

  const selected = variantStyles[variant] || variantStyles.alice;

  // Render micro-pip for active/success/danger states
  const hasLiveDot = ["success", "downy", "gradeO"].includes(variant);
  const isDanger = ["danger", "gradeF"].includes(variant);
  const isWarning = ["warning", "jonquil", "gradeB"].includes(variant);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono tracking-wide border backdrop-blur-sm transition-all ${selected} ${className}`}
    >
      {hasLiveDot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />}
      {isDanger && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />}
      {isWarning && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />}
      {children}
    </span>
  );
};

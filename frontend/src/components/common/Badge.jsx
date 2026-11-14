import React from "react";

export const Badge = ({ variant = "default", children, className = "" }) => {
  const variantStyles = {
    // Brand Downy
    downy: "bg-downy/15 text-downy border-downy/30",
    // Soft Melrose
    melrose: "bg-melrose/15 text-melrose border-melrose/30",
    // Electric Jonquil
    jonquil: "bg-jonquil/15 text-[#b6cd56] border-jonquil/30",
    // Alice Blue neutral
    alice: "bg-alice/10 text-alice border-alice/20",
    // Status Success (green/downy)
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    // Warning (amber/jonquil)
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    // Danger / Shortage / Fail
    danger: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    // Neutral
    neutral: "bg-charcoal-elevated text-alice-muted border-charcoal-border",
    // Grade O / Outstanding
    gradeO: "bg-downy/20 text-downy border-downy/40 font-bold",
    gradeA: "bg-melrose/20 text-melrose border-melrose/40 font-semibold",
    gradeB: "bg-jonquil/20 text-[#bfd948] border-jonquil/40 font-semibold",
    gradeF: "bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold",
  };

  const selected = variantStyles[variant] || variantStyles.alice;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide transition-all ${selected} ${className}`}
    >
      {children}
    </span>
  );
};

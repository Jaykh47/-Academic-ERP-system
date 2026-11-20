import React from "react";

export const LoadingSpinner = ({ size = "md", label = "Loading data..." }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-10 h-10 border-2",
  }[size] || "w-8 h-8 border-2";

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div
        className={`${sizeClasses} border-white/10 border-t-teal-400 border-r-indigo-400 rounded-full animate-spin`}
      />
      {label && <p className="text-[11px] font-mono text-slate-400 tracking-wide">{label}</p>}
    </div>
  );
};

import React from "react";

export const LoadingSpinner = ({ size = "md", label = "Loading data..." }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  }[size] || "w-8 h-8 border-3";

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div
        className={`${sizeClasses} border-charcoal-border border-t-downy border-r-melrose rounded-full animate-spin shadow-lg shadow-downy/20`}
      />
      {label && <p className="text-xs font-medium text-alice-muted animate-pulse">{label}</p>}
    </div>
  );
};

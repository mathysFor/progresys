"use client";

export default function ProgressBar({ 
  percent = 0, 
  className = "",
  showLabel = false,
  label = null,
  size = "md",
  ...props 
}) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const displayLabel = label !== null ? label : `${Math.round(clampedPercent)}%`;
  
  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };
  
  return (
    <div className={`w-full ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-slate-600 font-medium">{displayLabel}</span>
        </div>
      )}
      <div className={`w-full bg-slate-200/70 rounded-full ${sizeClasses[size] || sizeClasses.md} overflow-hidden`}>
        <div
          className="gradient-primary h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedPercent}%` }}
          role="progressbar"
          aria-valuenow={clampedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}


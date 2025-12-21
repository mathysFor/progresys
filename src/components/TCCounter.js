"use client";

import { formatTimeReadable } from "../lib/utils/time.js";
import ProgressBar from "./ProgressBar.js";

export default function TCCounter({ 
  tcProgress,
  className = "",
  ...props 
}) {
  if (!tcProgress) {
    return null;
  }

  const { percentComplete, timeSpentSeconds, totalDurationSeconds } = tcProgress;

  return (
    <div className={`relative bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 overflow-hidden ${className}`} {...props}>
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/50 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-indigo-900">Tronc Commun</h4>
          </div>
          <span className="text-lg font-bold text-indigo-700">
            {Math.round(percentComplete)}%
          </span>
        </div>
        
        <ProgressBar 
          percent={percentComplete} 
          size="sm"
          className="mb-2"
        />
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-indigo-600 font-medium">
            {formatTimeReadable(timeSpentSeconds)} / {formatTimeReadable(totalDurationSeconds)}
          </span>
          <span className="text-indigo-500">
            Reste {formatTimeReadable(Math.max(0, totalDurationSeconds - timeSpentSeconds))}
          </span>
        </div>
      </div>
    </div>
  );
}


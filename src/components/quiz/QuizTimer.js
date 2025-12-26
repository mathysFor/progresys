"use client";

import { useEffect, useState } from "react";
import { formatTime, isTimeExpired } from "../../lib/quiz/timer.js";

export default function QuizTimer({ startedAt, durationSeconds = 1800, onExpire }) {
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startedAt) {
      setTimeRemaining(durationSeconds);
      return;
    }

    const updateTimer = () => {
      const startTime = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);

      setTimeRemaining(remaining);
      
      if (remaining === 0 && !isExpired) {
        setIsExpired(true);
        if (onExpire) {
          onExpire();
        }
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, durationSeconds, isExpired, onExpire]);

  const isWarning = timeRemaining <= 300; // 5 minutes
  const isCritical = timeRemaining <= 60; // 1 minute
  const progressPercent = (timeRemaining / durationSeconds) * 100;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 ${
      isExpired
        ? "bg-red-50 border-red-200 text-red-700"
        : isCritical
        ? "bg-red-50 border-red-200 text-red-700 animate-pulse"
        : isWarning
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-teal-50 border-teal-200 text-teal-700"
    }`}>
      {/* Timer icon */}
      <div className="relative">
        <svg
          className={`w-5 h-5 ${isExpired || isCritical ? "animate-pulse" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      {/* Time display */}
      <span className="font-mono font-bold text-lg tracking-wider">
        {isExpired ? "00:00" : formatTime(timeRemaining)}
      </span>
      
      {/* Status indicator */}
      {isExpired ? (
        <span className="text-xs font-semibold uppercase tracking-wider">Terminé</span>
      ) : isCritical ? (
        <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Urgent !</span>
      ) : isWarning ? (
        <span className="text-xs font-medium opacity-75">5 min</span>
      ) : null}
    </div>
  );
}

"use client";

import { getModuleProgress, isModuleQuizUnlocked } from "../lib/selectors/formations.js";
import { formatTimeReadable } from "../lib/utils/time.js";

/**
 * ModuleRoadmap - Displays a visual roadmap of modules with progress and quiz indicators
 * @param {Object} formation - Formation object with modules
 * @param {Object} userProgress - User progress data (progressByCourseId)
 * @param {string} className - Additional CSS classes
 */
export default function ModuleRoadmap({ 
  formation, 
  userProgress = {},
  className = "",
}) {
  if (!formation || !formation.modules || formation.modules.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {formation.modules.map((module, index) => {
        const progress = getModuleProgress(formation.id, module.id, userProgress);
        const quizUnlocked = isModuleQuizUnlocked(formation.id, module.id, userProgress);
        const isComplete = progress.percentComplete >= 100;
        const isStarted = progress.timeSpentSeconds > 0;

        return (
          <div
            key={module.id}
            className="relative"
          >
            {/* Connection line to next module */}
            {index < formation.modules.length - 1 && (
              <div className="absolute left-4 top-10 w-0.5 h-6 bg-slate-200" />
            )}
            
            <div className="flex items-start gap-3">
              {/* Progress indicator circle */}
              <div className={`
                relative w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
                ${isComplete 
                  ? "bg-teal-500 text-white" 
                  : isStarted 
                    ? "bg-teal-100 text-teal-600 border-2 border-teal-300" 
                    : "bg-slate-100 text-slate-400 border-2 border-slate-200"
                }
              `}>
                {isComplete ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>

              {/* Module content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className={`text-sm font-medium truncate ${
                    isComplete ? "text-teal-700" : "text-slate-700"
                  }`}>
                    {module.name}
                  </h4>
                  
                  {/* Quiz indicator */}
                  <div className={`
                    flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0
                    ${quizUnlocked 
                      ? "bg-green-50 text-green-600" 
                      : "bg-slate-100 text-slate-400"
                    }
                  `}>
                    {quizUnlocked ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Quiz</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Quiz</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isComplete 
                          ? "bg-teal-500" 
                          : "bg-gradient-to-r from-teal-400 to-cyan-400"
                      }`}
                      style={{ width: `${Math.min(100, progress.percentComplete)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums shrink-0">
                    {Math.round(progress.percentComplete)}%
                  </span>
                </div>

                {/* Time spent */}
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatTimeReadable(progress.timeSpentSeconds)} / {formatTimeReadable(progress.totalDurationSeconds)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


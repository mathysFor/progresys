"use client";

import { useEffect, useState } from "react";

export default function QuizResults({ score, total, percentage, passed, timeSpent }) {
  const [showContent, setShowContent] = useState(false);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    // Trigger animations after mount
    setTimeout(() => setShowContent(true), 100);
    
    // Animate percentage counter
    const duration = 1500;
    const steps = 60;
    const increment = percentage / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= percentage) {
        setAnimatedPercentage(percentage);
        clearInterval(timer);
      } else {
        setAnimatedPercentage(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [percentage]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {passed ? (
          <>
            <div className="absolute top-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-linear-to-br from-teal-100/60 to-cyan-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "8s" }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-linear-to-tr from-cyan-100/60 to-teal-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-linear-to-br from-red-100/40 to-orange-100/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "8s" }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-linear-to-tr from-orange-100/40 to-red-100/30 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
          </>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className={`max-w-lg w-full transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Result card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 text-center">
            {/* Icon */}
            <div className={`relative w-20 h-20 mx-auto mb-6`}>
              <div className={`absolute inset-0 rounded-full ${passed ? "bg-teal-100" : "bg-red-100"}`} />
              <div className={`absolute inset-2 rounded-full flex items-center justify-center ${passed ? "bg-teal-500" : "bg-red-500"}`}>
                {passed ? (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {passed ? "Quiz Réussi !" : "Quiz Échoué"}
            </h1>

            <p className="text-slate-600 mb-8">
              {passed
                ? "Félicitations, vous avez validé la formation !"
                : "Vous devez obtenir au moins 70% pour valider."}
            </p>

            {/* Score display */}
            <div className="relative mb-8">
              {/* Circular progress */}
              <div className="relative w-36 h-36 mx-auto">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 144 144">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="8"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    fill="none"
                    stroke={passed ? "#14b8a6" : "#ef4444"}
                    strokeWidth="8"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * animatedPercentage) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${passed ? "text-teal-600" : "text-red-600"}`}>
                    {animatedPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Score</p>
                <p className="text-2xl font-bold text-slate-900">
                  {score} <span className="text-slate-400 font-normal text-lg">/ {total}</span>
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Temps</p>
                <p className="text-2xl font-bold text-slate-900">
                  {timeSpent ? (
                    <>
                      {Math.floor(timeSpent / 60)}
                      <span className="text-slate-400 font-normal text-lg">m </span>
                      {timeSpent % 60}
                      <span className="text-slate-400 font-normal text-lg">s</span>
                    </>
                  ) : (
                    "--"
                  )}
                </p>
              </div>
            </div>

            {/* Status message */}
            <div className={`p-4 rounded-xl ${passed ? "bg-teal-50 border border-teal-100" : "bg-red-50 border border-red-100"}`}>
              <p className={`text-sm ${passed ? "text-teal-700" : "text-red-700"}`}>
                {passed
                  ? "✓ Vos résultats ont été enregistrés et l'administrateur a été notifié."
                  : "Contactez l'administrateur si vous souhaitez obtenir une deuxième chance."}
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-sm mt-6">
            Vous pouvez fermer cette page
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn, getProgress, clearUserSession, getUserSession } from "../../lib/progress/store.js";
import { getFormations } from "../../lib/mock/formations.js";
import { getFormationProgress, getTCProgress } from "../../lib/selectors/formations.js";
import { getResumeCourse, hasPdfContent, getPdfContent } from "../../lib/selectors/courses.js";
import { formatTimeReadable } from "../../lib/utils/time.js";
import ProgressBar from "../../components/ProgressBar.js";
import TCCounter from "../../components/TCCounter.js";

export default function DashboardPage() {
  const router = useRouter();
  const [formations, setFormations] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const entitlements = null;
    const loadedFormations = getFormations(entitlements);
    const progress = getProgress();
    const session = getUserSession();

    setFormations(loadedFormations);
    setUserProgress(progress);
    setUser(session);
  }, [router]);

  const handleResume = (formationId) => {
    const resumeCourse = getResumeCourse(formationId, userProgress);
    if (resumeCourse) {
      router.push(`/module/${resumeCourse.id}`);
    }
  };

  const handleViewRoadmap = (formationId) => {
    router.push(`/roadmap?formationId=${formationId}`);
  };

  const handleDownload = (formationId) => {
    const resumeCourse = getResumeCourse(formationId, userProgress);
    if (resumeCourse && hasPdfContent(resumeCourse)) {
      const pdfContent = getPdfContent(resumeCourse);
      if (pdfContent) {
        window.open(pdfContent.url, "_blank");
      }
    }
  };

  const handleLogout = () => {
    clearUserSession();
    router.push("/login");
  };

  if (formations.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-[#2D6A6E] animate-spin" />
          <p className="text-slate-500 font-medium">Chargement de vos formations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header with pattern */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-primary" />
        
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl translate-x-1/3 translate-y-1/2" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-teal-100 text-sm font-medium mb-1">
                Bienvenue, {user?.name || "Apprenant"}
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Mes Formations
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="self-start sm:self-auto px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all duration-200"
            >
              Déconnexion
            </button>
          </div>
          
          {/* Stats bar */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
              <p className="text-teal-100 text-xs font-medium uppercase tracking-wider">Formations</p>
              <p className="text-white text-2xl font-bold mt-1">{formations.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
              <p className="text-teal-100 text-xs font-medium uppercase tracking-wider">En cours</p>
              <p className="text-white text-2xl font-bold mt-1">
                {formations.filter(f => {
                  const p = getFormationProgress(f.id, userProgress);
                  return p.percentComplete > 0 && p.percentComplete < 100;
                }).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
              <p className="text-teal-100 text-xs font-medium uppercase tracking-wider">Terminées</p>
              <p className="text-white text-2xl font-bold mt-1">
                {formations.filter(f => {
                  const p = getFormationProgress(f.id, userProgress);
                  return p.percentComplete >= 100;
                }).length}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
              <p className="text-teal-100 text-xs font-medium uppercase tracking-wider">Temps total</p>
              <p className="text-white text-2xl font-bold mt-1">
                {formatTimeReadable(
                  formations.reduce((acc, f) => {
                    const p = getFormationProgress(f.id, userProgress);
                    return acc + p.timeSpentSeconds;
                  }, 0)
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-2">
          {formations.map((formation, index) => {
            const formationProgress = getFormationProgress(formation.id, userProgress);
            const tcProgress = getTCProgress(formation.id, userProgress);
            const resumeCourse = getResumeCourse(formation.id, userProgress);
            const hasPdf = resumeCourse && hasPdfContent(resumeCourse);
            const isComplete = formationProgress.percentComplete >= 100;
            const isStarted = formationProgress.percentComplete > 0;

            return (
              <article
                key={formation.id}
                className="group relative bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Top accent bar */}
                <div className="h-1.5 gradient-primary" />
                
                <div className="p-6 lg:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Formation type badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          formation.type === "longue" 
                            ? "bg-indigo-50 text-indigo-700" 
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {formation.type === "longue" ? "Formation Longue" : "Formation Courte"}
                        </span>
                        {/* Status badge */}
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Terminé
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
                        {formation.name}
                      </h2>
                    </div>
                    
                    {/* Progress circle */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="#e2e8f0"
                          strokeWidth="6"
                          fill="none"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="url(#gradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - formationProgress.percentComplete / 100)}`}
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6BC4C4" />
                          <stop offset="100%" stopColor="#2D6A6E" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-slate-700">
                          {Math.round(formationProgress.percentComplete)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress details */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">Progression</span>
                      <span className="text-slate-700 font-medium">
                        {formatTimeReadable(formationProgress.timeSpentSeconds)} / {formatTimeReadable(formationProgress.totalDurationSeconds)}
                      </span>
                    </div>
                    <ProgressBar percent={formationProgress.percentComplete} />
                  </div>

                  {/* TC Counter */}
                  {tcProgress && (
                    <div className="mb-6">
                      <TCCounter tcProgress={tcProgress} />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleResume(formation.id)}
                      className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-semibold shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      {isStarted ? "Reprendre" : "Commencer"}
                    </button>
                    
                    <button
                      onClick={() => handleViewRoadmap(formation.id)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Fiche de route
                    </button>
                    
                    {hasPdf && (
                      <button
                        onClick={() => handleDownload(formation.id)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProgress, getUserSession, getEntitlements } from "../../lib/progress/store-firebase.js";
import { signOut } from "../../lib/firebase/auth.js";
import { useAuthState } from "../../lib/hooks/useAuthState.js";
import { getFormations } from "../../lib/mock/formations.js";
import { getFormationProgress, getTCProgress } from "../../lib/selectors/formations.js";
import { getResumeCourse, hasPdfContent, getPdfContent } from "../../lib/selectors/courses.js";
import { formatTimeReadable } from "../../lib/utils/time.js";
import ProgressBar from "../../components/ProgressBar.js";
import TCCounter from "../../components/TCCounter.js";
import ModuleRoadmap from "../../components/ModuleRoadmap.js";

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthState();
  const [formations, setFormations] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Wait for auth state to be determined
      if (authLoading) {
        return;
      }

      if (!authUser) {
        router.push("/login");
        return;
      }

      try {
        console.log("Loading dashboard data...");
        
        // Load user session
        const sessionResult = await getUserSession();
        console.log("User session result:", sessionResult);
        if (sessionResult.error) {
          console.error("Error loading user session:", sessionResult.error);
        } else {
          setUser(sessionResult.data);
        }

        // Load entitlements
        const entitlementsResult = await getEntitlements();
        console.log("Entitlements result:", entitlementsResult);
        const entitlements = entitlementsResult.data || null;

        // Load formations
        const loadedFormations = getFormations(entitlements);
        console.log("Loaded formations:", loadedFormations);
        setFormations(loadedFormations);

        // Load progress
        const progressResult = await getProgress();
        console.log("Progress result:", progressResult);
        if (progressResult.error) {
          console.error("Error loading progress:", progressResult.error);
          setUserProgress({});
        } else {
          setUserProgress(progressResult.data || {});
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        console.log("Loading complete, setting isLoading to false");
        setIsLoading(false);
      }
    };

    loadData();
  }, [router, authUser, authLoading]);

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

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-[#00BCD4] animate-spin" />
          <p className="text-slate-500 font-medium">Chargement de vos formations...</p>
        </div>
      </div>
    );
  }

  // Afficher un message si aucune formation après le chargement
  if (formations.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Aucune formation disponible
          </h2>
          <p className="text-slate-600 mb-6">
            Vous n&apos;avez pas encore accès à des formations. Contactez l&apos;administrateur pour obtenir un accès.
          </p>
          <button
            onClick={handleLogout}
            className="cursor-pointer px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Retour à la connexion
          </button>
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
              <p className="text-teal-800 text-sm font-medium mb-1">
                Bienvenue, {user?.firstName || user?.name || "Apprenant"}
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                Mes Formations
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="cursor-pointer self-start sm:self-auto px-5 py-2.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-slate-900/20 text-white text-sm font-medium hover:bg-slate-900 transition-all duration-200"
            >
              Déconnexion
            </button>
          </div>
          
          {/* Stats bar */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/50 shadow-lg">
              <p className="text-teal-700 text-xs font-semibold uppercase tracking-wider">Formations</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">{formations.length}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/50 shadow-lg">
              <p className="text-teal-700 text-xs font-semibold uppercase tracking-wider">En cours</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">
                {formations.filter(f => {
                  const p = getFormationProgress(f.id, userProgress);
                  return p.percentComplete > 0 && p.percentComplete < 100;
                }).length}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/50 shadow-lg">
              <p className="text-teal-700 text-xs font-semibold uppercase tracking-wider">Terminées</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">
                {formations.filter(f => {
                  const p = getFormationProgress(f.id, userProgress);
                  return p.percentComplete >= 100;
                }).length}
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/50 shadow-lg">
              <p className="text-teal-700 text-xs font-semibold uppercase tracking-wider">Temps total</p>
              <p className="text-slate-900 text-2xl font-bold mt-1">
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
        <div className="grid gap-6 md:grid-cols-2">
          {formations.map((formation) => {
            const formationProgress = getFormationProgress(formation.id, userProgress);
            const tcProgress = getTCProgress(formation.id, userProgress);
            const resumeCourse = getResumeCourse(formation.id, userProgress);
            const hasPdf = resumeCourse && hasPdfContent(resumeCourse);
            const isComplete = formationProgress.percentComplete >= 100;
            const isStarted = formationProgress.percentComplete > 0;
            const isLongFormation = formation.type === "longue";

            return (
              <article
                key={formation.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div className="p-6">
                  {/* Header - simplified */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-slate-900 mb-1 truncate">
                        {formation.name}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {formatTimeReadable(formationProgress.timeSpentSeconds)} / {formatTimeReadable(formationProgress.totalDurationSeconds)}
                        </span>
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Terminé
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress percentage - compact */}
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-bold text-teal-600">
                        {Math.round(formationProgress.percentComplete)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar - simple */}
                  <div className="mb-5">
                    <ProgressBar percent={formationProgress.percentComplete} />
                  </div>

                  {/* Module Roadmap - only for long formations */}
                  {isLongFormation && formation.modules && formation.modules.length > 1 && (
                    <div className="mb-5 p-4 bg-slate-50 rounded-xl">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Progression des modules
                      </h3>
                      <ModuleRoadmap 
                        formation={formation} 
                        userProgress={userProgress}
                      />
                    </div>
                  )}

                  {/* TC Counter - compact version for short formations */}
                  {tcProgress && !isLongFormation && (
                    <div className="mb-5">
                      <TCCounter tcProgress={tcProgress} />
                    </div>
                  )}

                  {/* Actions - simplified */}
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleResume(formation.id)}
                      className="cursor-pointer flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      {isStarted ? "Reprendre" : "Commencer"}
                    </button>
                    
                    <button
                      onClick={() => handleViewRoadmap(formation.id)}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Détails
                    </button>
                    
                    {hasPdf && (
                      <button
                        onClick={() => handleDownload(formation.id)}
                        className="cursor-pointer inline-flex items-center justify-center px-3 py-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                        title="Télécharger le PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
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


"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { isLoggedIn, getProgress } from "../../lib/progress/store.js";
import { getFormationById } from "../../lib/mock/formations.js";
import { getFormationProgress, getTCProgress } from "../../lib/selectors/formations.js";
import { formatTimeReadable } from "../../lib/utils/time.js";
import FormationTree from "../../components/FormationTree.js";
import Button from "../../components/Button.js";
import ProgressBar from "../../components/ProgressBar.js";
import TCCounter from "../../components/TCCounter.js";

function RoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formationId = searchParams.get("formationId");

  const [formation, setFormation] = useState(null);
  const [formationProgress, setFormationProgress] = useState(null);
  const [tcProgress, setTcProgress] = useState(null);
  const [userProgress, setUserProgress] = useState({});

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    if (!formationId) {
      router.push("/dashboard");
      return;
    }

    const loadedFormation = getFormationById(formationId);
    if (!loadedFormation) {
      router.push("/dashboard");
      return;
    }

    setFormation(loadedFormation);

    const progress = getProgress();
    setUserProgress(progress);

    const formProgress = getFormationProgress(formationId, progress);
    setFormationProgress(formProgress);

    const tc = getTCProgress(formationId, progress);
    setTcProgress(tc);
  }, [formationId, router]);

  if (!formation || !formationProgress) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="secondary"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 mb-4"
            >
              ← Retour au dashboard
            </Button>
            <h1 className="text-3xl font-bold mb-2">{formation.name}</h1>
            <p className="text-white text-opacity-90">
              Fiche de route complète
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Tree */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Progression globale
              </h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(formationProgress.percentComplete)}%
                </span>
              </div>
              <ProgressBar
                percent={formationProgress.percentComplete}
                className="mb-2"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {formatTimeReadable(formationProgress.timeSpentSeconds)} /{" "}
                  {formatTimeReadable(formationProgress.totalDurationSeconds)}
                </span>
                <span>
                  Restant: {formatTimeReadable(
                    Math.max(
                      0,
                      formationProgress.totalDurationSeconds -
                        formationProgress.timeSpentSeconds
                    )
                  )}
                </span>
              </div>
            </div>

            <FormationTree formation={formation} userProgress={userProgress} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Formation Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Type:</span>{" "}
                  <span className="text-gray-600">
                    {formation.type === "longue"
                      ? "Formation Longue"
                      : "Formation Courte"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Modules:</span>{" "}
                  <span className="text-gray-600">
                    {formation.modules?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* TC Counter */}
            {tcProgress && (
              <TCCounter tcProgress={tcProgress} />
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions rapides
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="w-full"
                >
                  Retour au dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F9FAFB] p-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-teal-200 border-t-[#387d81] rounded-full animate-spin mb-4" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </div>
      }
    >
      <RoadmapContent />
    </Suspense>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";
import { subscribeToQuizAttempts, getAllQuizAttempts } from "../../../../lib/firebase/quiz-firestore.js";

export default function QuizResultsPage() {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, passed, failed
  const [newResultsCount, setNewResultsCount] = useState(0);

  useEffect(() => {
    if (adminLoading) return;
    
    if (!isAdmin) {
      return;
    }

    // Load initial results
    const loadInitialResults = async () => {
      try {
        const filters = {};
        if (filter === "passed") filters.passed = true;
        if (filter === "failed") filters.passed = false;
        
        const result = await getAllQuizAttempts(filters);
        if (!result.error && result.data) {
          setAttempts(result.data);
          setNewResultsCount(0);
        }
      } catch (error) {
        console.error("Error loading results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialResults();

    // Subscribe to real-time updates
    const filters = {};
    if (filter === "passed") filters.passed = true;
    if (filter === "failed") filters.passed = false;

    const unsubscribe = subscribeToQuizAttempts((newAttempts) => {
      setAttempts(newAttempts);
      
      // Check for new results (completed in last minute)
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const newResults = newAttempts.filter((attempt) => {
        if (!attempt.completedAt) return false;
        const completedAt = attempt.completedAt.toDate
          ? attempt.completedAt.toDate()
          : new Date(attempt.completedAt);
        return completedAt > oneMinuteAgo;
      });
      
      if (newResults.length > 0) {
        setNewResultsCount(newResults.length);
        // Show browser notification if available
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Nouveau résultat de quiz", {
            body: `${newResults.length} nouveau(x) résultat(s) reçu(s)`,
            icon: "/favicon.ico",
          });
        }
      }
    }, filters);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, adminLoading, filter]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = ["Email", "Score", "Total", "Pourcentage", "Statut", "Date"];
    const rows = attempts.map((attempt) => [
      attempt.email,
      attempt.score || 0,
      attempt.total || 80,
      attempt.percentage || 0,
      attempt.passed ? "Réussi" : "Échoué",
      formatDate(attempt.completedAt),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `quiz-results-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (adminLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Résultats du Quiz</h1>
            <p className="text-slate-600 mt-1">Vue en temps réel des résultats</p>
          </div>
          <div className="flex items-center gap-4">
            {newResultsCount > 0 && (
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold animate-pulse">
                {newResultsCount} nouveau(x) résultat(s)
              </div>
            )}
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Exporter CSV
            </button>
          </div>
        </div>

        <div className="mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
          >
            <option value="all">Tous les résultats</option>
            <option value="passed">Réussis uniquement</option>
            <option value="failed">Échoués uniquement</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Pourcentage
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Temps passé
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Aucun résultat pour le moment
                    </td>
                  </tr>
                ) : (
                  attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{attempt.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {attempt.score || 0} / {attempt.total || 80}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {attempt.percentage || 0}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            attempt.passed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {attempt.passed ? "Réussi" : "Échoué"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {attempt.timeSpentSeconds
                          ? `${Math.floor(attempt.timeSpentSeconds / 60)} min ${attempt.timeSpentSeconds % 60} sec`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(attempt.completedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


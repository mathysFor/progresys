"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "../../../lib/hooks/useAdminAuth.js";
import AdminLayout from "../../../components/admin/AdminLayout.js";
import {
  getAllQuizQuestions,
  saveQuizQuestion,
} from "../../../lib/firebase/quiz-firestore.js";
import {
  getAllParticipants,
  saveParticipant,
  importParticipants,
  updateParticipantAttempts,
} from "../../../lib/firebase/quiz-participants.js";
import { getAllQuizAttempts } from "../../../lib/firebase/quiz-firestore.js";
import { validateQuestion, normalizeQuestion } from "../../../lib/quiz/questions.js";

export default function AdminQuizPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("questions"); // questions, participants, results
  const [isLoading, setIsLoading] = useState(true);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Participants state
  const [participants, setParticipants] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState("");

  // Results state
  const [attempts, setAttempts] = useState([]);
  const [resultsFilter, setResultsFilter] = useState("all"); // all, passed, failed

  useEffect(() => {
    const loadData = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        return;
      }

      try {
        await loadQuestions();
        await loadParticipants();
        await loadResults();
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAdmin, adminLoading, resultsFilter]);

  const loadQuestions = async () => {
    const result = await getAllQuizQuestions();
    if (!result.error && result.data) {
      setQuestions(result.data);
    }
  };

  const loadParticipants = async () => {
    const result = await getAllParticipants();
    if (!result.error && result.data) {
      setParticipants(result.data);
    }
  };

  const loadResults = async () => {
    const filters = {};
    if (resultsFilter === "passed") filters.passed = true;
    if (resultsFilter === "failed") filters.passed = false;
    
    const result = await getAllQuizAttempts(filters);
    if (!result.error && result.data) {
      setAttempts(result.data);
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;

    const validation = validateQuestion(editingQuestion);
    if (!validation.valid) {
      alert("Erreurs: " + validation.errors.join(", "));
      return;
    }

    const normalized = normalizeQuestion(editingQuestion);
    const questionId = editingQuestion.id || `q_${Date.now()}`;

    const result = await saveQuizQuestion(questionId, normalized);
    if (result.error) {
      alert("Erreur: " + result.error);
      return;
    }

    await loadQuestions();
    setIsEditingQuestion(false);
    setEditingQuestion(null);
  };

  const handleAddQuestion = () => {
    setEditingQuestion({
      question: "",
      type: "qcm",
      options: ["", "", "", ""],
      correctAnswer: 0,
      order: questions.length,
    });
    setIsEditingQuestion(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion({ ...question });
    setIsEditingQuestion(true);
  };

  const handleBulkImport = async (questionsToImport) => {
    if (!confirm(`Voulez-vous importer ${questionsToImport.length} questions ?`)) {
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/quiz/import-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: questionsToImport }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'import");
      }

      alert(
        `Import terminé: ${result.results.success} réussies, ${result.results.failed} échouées`
      );

      if (result.results.errors.length > 0) {
        console.error("Erreurs d'import:", result.results.errors);
      }

      await loadQuestions();
    } catch (error) {
      console.error("Error importing questions:", error);
      alert("Erreur lors de l'import: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportParticipants = async () => {
    if (!importText.trim()) {
      alert("Veuillez entrer des données à importer");
      return;
    }

    setIsImporting(true);
    try {
      // Parse CSV-like format: email,firstName,lastName,phone,birthDate,address,postalCode
      const lines = importText.trim().split("\n");
      const participantsData = [];

      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 1 && parts[0]) {
          participantsData.push({
            email: parts[0],
            firstName: parts[1] || "",
            lastName: parts[2] || "",
            phone: parts[3] || "",
            birthDate: parts[4] || "",
            address: parts[5] || "",
            postalCode: parts[6] || "",
            allowedAttempts: 1,
          });
        }
      }

      if (participantsData.length === 0) {
        alert("Aucun participant valide trouvé");
        setIsImporting(false);
        return;
      }

      const result = await importParticipants(participantsData);
      alert(
        `${result.success} participant(s) importé(s) avec succès, ${result.failed} échec(s)`
      );

      if (result.errors.length > 0) {
        console.error("Import errors:", result.errors);
      }

      setImportText("");
      await loadParticipants();
    } catch (error) {
      console.error("Error importing participants:", error);
      alert("Erreur lors de l'import: " + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleAllowRetry = async (participantId, currentAttempts) => {
    if (!confirm("Voulez-vous autoriser une tentative supplémentaire pour ce participant ?")) {
      return;
    }

    const result = await updateParticipantAttempts(participantId, currentAttempts + 1);
    if (result.error) {
      alert("Erreur: " + result.error);
      return;
    }

    await loadParticipants();
    alert("Tentative supplémentaire autorisée avec succès");
  };

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestion du Quiz</h1>
          <p className="text-slate-600 mt-1">Gérez les questions, participants et résultats</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-4">
            {[
              { id: "questions", label: "Questions" },
              { id: "participants", label: "Participants" },
              { id: "results", label: "Résultats" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Questions ({questions.length})
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const importText = prompt(
                      "Pour importer en masse, utilisez le script:\n\nnpm run import-quiz\n\nOu collez les questions au format JSON:\n[{question: '...', type: 'qcm', options: [...], correctAnswer: 0, order: 1}, ...]"
                    );
                    if (importText) {
                      try {
                        const parsed = JSON.parse(importText);
                        if (Array.isArray(parsed)) {
                          handleBulkImport(parsed);
                        } else {
                          alert("Le format doit être un tableau JSON");
                        }
                      } catch (e) {
                        alert("Erreur de parsing JSON: " + e.message);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  📥 Importer en masse
                </button>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  + Ajouter une question
                </button>
              </div>
            </div>

            {isEditingQuestion ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  {editingQuestion.id ? "Modifier" : "Nouvelle"} question
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Question
                    </label>
                    <textarea
                      value={editingQuestion.question || ""}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, question: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Type
                    </label>
                    <select
                      value={editingQuestion.type || "qcm"}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, type: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    >
                      <option value="qcm">QCM</option>
                      <option value="true_false">Vrai/Faux</option>
                    </select>
                  </div>

                  {(editingQuestion.type === "qcm" || editingQuestion.type === "multiple_choice") && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Options
                        </label>
                        {(editingQuestion.options || []).map((option, index) => (
                          <div key={index} className="mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(editingQuestion.options || [])];
                                newOptions[index] = e.target.value;
                                setEditingQuestion({ ...editingQuestion, options: newOptions });
                              }}
                              placeholder={`Option ${index + 1}`}
                              className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Réponse correcte (index: 0, 1, 2, 3...)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editingQuestion.correctAnswer || 0}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              correctAnswer: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {editingQuestion.type === "true_false" && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Réponse correcte
                      </label>
                      <select
                        value={editingQuestion.correctAnswer || "true"}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            correctAnswer: e.target.value === "true",
                          })
                        }
                        className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                      >
                        <option value="true">Vrai</option>
                        <option value="false">Faux</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Ordre
                    </label>
                    <input
                      type="number"
                      value={editingQuestion.order || 0}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          order: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveQuestion}
                      className="px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingQuestion(false);
                        setEditingQuestion(null);
                      }}
                      className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-teal-600">
                          #{question.order || 0}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {question.type}
                        </span>
                      </div>
                      <p className="font-medium text-slate-900 mb-1">{question.question}</p>
                      {question.options && question.options.length > 0 && (
                        <ul className="text-sm text-slate-600 mt-2">
                          {question.options.map((opt, idx) => (
                            <li key={idx} className={idx === question.correctAnswer ? "font-semibold text-green-600" : ""}>
                              {idx + 1}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === "participants" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Participants ({participants.length})
              </h2>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Importer des participants</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Format CSV: email,firstName,lastName,phone,birthDate,address,postalCode
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="email@example.com,Prénom,Nom,0612345678,01/01/1990,Adresse,75000"
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none resize-none font-mono text-sm"
                />
                <button
                  onClick={handleImportParticipants}
                  disabled={isImporting}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-70 transition-colors"
                >
                  {isImporting ? "Import en cours..." : "Importer"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-white rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{participant.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Tentatives autorisées: {participant.allowedAttempts || 1}</span>
                        {participant.phone && <span>Tél: {participant.phone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAllowRetry(participant.id, participant.allowedAttempts || 1)
                      }
                      className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
                    >
                      Autoriser retry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Résultats ({attempts.length})
              </h2>
              <select
                value={resultsFilter}
                onChange={(e) => setResultsFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
              >
                <option value="all">Tous</option>
                <option value="passed">Réussis</option>
                <option value="failed">Échoués</option>
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
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {attempts.map((attempt) => (
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
                          {formatDate(attempt.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


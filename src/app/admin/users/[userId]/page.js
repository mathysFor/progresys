"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import { 
  getUserById, 
  updateUser, 
  deleteUser, 
  getUserProgress,
  addFormationsToUser,
  removeFormationsFromUser,
  getUserSessions,
  getUserSessionStats
} from "../../../../lib/firebase/admin-firestore.js";
import { formations as localFormations } from "../../../../lib/config/formations.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";
import DeleteConfirmModal from "../../../../components/admin/DeleteConfirmModal.js";
import { formatTimeReadable } from "../../../../lib/utils/time.js";
import { getFormationProgress } from "../../../../lib/selectors/formations.js";

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [user, setUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [sessionStats, setSessionStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formationModal, setFormationModal] = useState(false);
  const [selectedFormations, setSelectedFormations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        // Load user
        const userResult = await getUserById(userId);
        if (userResult.error) {
          console.error("Error loading user:", userResult.error);
          router.push("/admin/users");
          return;
        }
        setUser(userResult.data);
        setEditData(userResult.data);

        // Load progress
        const progressResult = await getUserProgress(userId);
        if (!progressResult.error) {
          setUserProgress(progressResult.data);
        }

        // Load sessions
        const sessionsResult = await getUserSessions(userId);
        if (!sessionsResult.error) {
          setUserSessions(sessionsResult.data || []);
        }

        // Load session stats
        const statsResult = await getUserSessionStats(userId);
        if (!statsResult.error) {
          setSessionStats(statsResult.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAdmin, adminLoading, router, userId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateUser(userId, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phone: editData.phone,
        birthDate: editData.birthDate,
        birthPlace: editData.birthPlace,
        address: editData.address,
      });

      if (!result.error) {
        setUser({ ...user, ...editData });
        setIsEditing(false);
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUser(userId);
      if (!result.error) {
        router.push("/admin/users");
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddFormations = async () => {
    if (selectedFormations.length === 0) return;
    
    setIsSaving(true);
    try {
      const result = await addFormationsToUser(userId, selectedFormations);
      if (!result.error) {
        const newFormations = [...new Set([...(user.formations || []), ...selectedFormations])];
        setUser({ ...user, formations: newFormations });
        setFormationModal(false);
        setSelectedFormations([]);
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error adding formations:", error);
      alert("Erreur lors de l'ajout des formations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveFormation = async (formationId) => {
    if (!confirm("Retirer cette formation ?")) return;
    
    try {
      const result = await removeFormationsFromUser(userId, [formationId]);
      if (!result.error) {
        const newFormations = (user.formations || []).filter(f => f !== formationId);
        setUser({ ...user, formations: newFormations });
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error removing formation:", error);
      alert("Erreur lors de la suppression de la formation");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFormationName = (formationId) => {
    const formation = localFormations.find(f => f.id === formationId);
    return formation ? formation.name : formationId;
  };

  // Calculate total progress time
  const getTotalTimeSpent = () => {
    if (!userProgress || !userProgress.progressByCourseId) return 0;
    return Object.values(userProgress.progressByCourseId).reduce((acc, course) => {
      return acc + (course.timeSpentSeconds || 0);
    }, 0);
  };

  // Calculate date when user reached 100% on all formations
  const getCompletionDate = () => {
    if (!user || !user.formations || !userProgress || !userSessions.length) return null;
    
    // Check if all formations are at 100%
    const allComplete = user.formations.every(formationId => {
      const progress = getFormationProgress(formationId, userProgress.progressByCourseId || {});
      return progress.percentComplete >= 100;
    });
    
    if (!allComplete) return null;
    
    // Find the latest completion date by checking when each formation reached 100%
    // We'll approximate by finding the last session date where progress indicates completion
    // Since we don't track exact completion timestamps, we use the last login date as approximation
    const sortedSessions = [...userSessions].sort((a, b) => {
      const aDate = a.loginAt?.toDate?.() || new Date(a.loginAt?.seconds * 1000) || new Date(0);
      const bDate = b.loginAt?.toDate?.() || new Date(b.loginAt?.seconds * 1000) || new Date(0);
      return bDate - aDate;
    });
    
    // Return the most recent session date as approximation
    if (sortedSessions.length > 0) {
      const lastSession = sortedSessions[0];
      return lastSession.loginAt?.toDate?.() || new Date(lastSession.loginAt?.seconds * 1000) || null;
    }
    
    return null;
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
    return null; // Will redirect
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Utilisateur non trouvé</p>
          <button
            onClick={() => router.push("/admin/users")}
            className="cursor-pointer mt-4 text-teal-600 hover:text-teal-700 font-medium"
          >
            ← Retour à la liste
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/users")}
            className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.email}
            </h1>
            <p className="text-slate-600 mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData(user);
                }}
                className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer px-4 py-2 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier
              </button>
              <button
                onClick={() => setDeleteModal(true)}
                className="cursor-pointer px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Informations personnelles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Prénom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.firstName || ""}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.firstName || "Non renseigné"}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Nom</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.lastName || ""}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.lastName || "Non renseigné"}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Téléphone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.phone || "Non renseigné"}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Date de naissance</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editData.birthDate || ""}
                    onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.birthDate || "Non renseigné"}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">Lieu de naissance</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.birthPlace || ""}
                    onChange={(e) => setEditData({ ...editData, birthPlace: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.birthPlace || "Non renseigné"}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-500 mb-1">Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.address || ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
                  />
                ) : (
                  <p className="text-slate-900">{user.address || "Non renseigné"}</p>
                )}
              </div>
            </div>
          </div>

          {/* Formations Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Formations</h2>
              <button
                onClick={() => setFormationModal(true)}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>
            
            {user.formations && user.formations.length > 0 ? (
              <div className="space-y-2">
                {user.formations.map((formationId) => (
                  <div
                    key={formationId}
                    className="cursor-pointer flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-900">{getFormationName(formationId)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveFormation(formationId)}
                      className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Aucune formation assignée</p>
            )}
          </div>

          {/* Relevé de connexion Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Relevé de connexion</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Date de début</p>
                <p className="text-sm font-semibold text-slate-900">
                  {sessionStats?.firstLoginAt 
                    ? formatDate(sessionStats.firstLoginAt)
                    : "N/A"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Date de fin (100%)</p>
                <p className="text-sm font-semibold text-slate-900">
                  {getCompletionDate() 
                    ? formatDate(getCompletionDate())
                    : "Non atteint"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Durée totale</p>
                <p className="text-sm font-semibold text-teal-600">
                  {sessionStats?.totalDurationSeconds 
                    ? formatTimeReadable(sessionStats.totalDurationSeconds)
                    : "0h 0min"}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Sessions totales</p>
                <p className="text-sm font-semibold text-slate-900">
                  {sessionStats?.totalSessions || 0}
                </p>
              </div>
            </div>

            {/* Sessions Table */}
            {userSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Connexion</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Déconnexion</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">Durée</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSessions.map((session) => {
                      const loginDate = session.loginAt?.toDate?.() || new Date(session.loginAt?.seconds * 1000) || null;
                      const logoutDate = session.logoutAt?.toDate?.() || (session.logoutAt?.seconds ? new Date(session.logoutAt.seconds * 1000) : null);
                      const duration = session.durationSeconds || 0;
                      
                      return (
                        <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-700">
                            {loginDate 
                              ? loginDate.toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {logoutDate 
                              ? logoutDate.toLocaleString("fr-FR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : session.isActive 
                                ? <span className="text-teal-600 font-medium">En cours</span>
                                : "N/A"}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {formatTimeReadable(duration)}
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-mono text-xs">
                            {session.ipAddress || "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">Aucune session enregistrée</p>
            )}
          </div>
        </div>

        {/* Right Column - Stats and Meta */}
        <div className="space-y-6">
          {/* Progress Stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Progression</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Temps total passé</p>
                <p className="text-2xl font-bold text-teal-600">
                  {formatTimeReadable(getTotalTimeSpent())}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Cours suivis</p>
                <p className="text-2xl font-bold text-slate-900">
                  {userProgress?.progressByCourseId ? Object.keys(userProgress.progressByCourseId).length : 0}
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Informations système</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-500">ID utilisateur</p>
                <p className="text-sm text-slate-700 font-mono break-all">{user.id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Inscrit le</p>
                <p className="text-sm text-slate-700">{formatDate(user.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Dernière mise à jour</p>
                <p className="text-sm text-slate-700">{formatDate(user.updatedAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500">Paiement entreprise</p>
                <p className="text-sm text-slate-700">{user.paidByCompany ? "Oui" : "Non"}</p>
              </div>
              
              {user.paymentStatus && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Statut paiement</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    user.paymentStatus === "succeeded" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {user.paymentStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${user.firstName || user.email} ? Cette action est irréversible.`}
        isLoading={isDeleting}
      />

      {/* Add Formation Modal */}
      {formationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setFormationModal(false)}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Ajouter des formations</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {localFormations.filter(f => !(user.formations || []).includes(f.id)).map((formation) => (
                  <label
                    key={formation.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFormations.includes(formation.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFormations([...selectedFormations, formation.id]);
                        } else {
                          setSelectedFormations(selectedFormations.filter(f => f !== formation.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <p className="font-medium text-slate-900">{formation.name}</p>
                      <p className="text-sm text-slate-500">{formation.price}€</p>
                    </div>
                  </label>
                ))}
                
                {localFormations.filter(f => !(user.formations || []).includes(f.id)).length === 0 && (
                  <p className="text-slate-500 text-center py-4">
                    Toutes les formations sont déjà assignées
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFormationModal(false);
                    setSelectedFormations([]);
                  }}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddFormations}
                  disabled={selectedFormations.length === 0 || isSaving}
                  className="cursor-pointer flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Ajout..." : `Ajouter (${selectedFormations.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


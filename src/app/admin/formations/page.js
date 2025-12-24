"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useAdminAuth } from "../../../lib/hooks/useAdminAuth.js";
import { 
  getAllFormationsFromFirestore, 
  deleteFormation,
  migrateFormationsToFirestore 
} from "../../../lib/firebase/admin-firestore.js";
import { formations as localFormations } from "../../../lib/mock/formations.js";
import AdminLayout from "../../../components/admin/AdminLayout.js";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal.js";

function FormationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  
  const [formations, setFormations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, formation: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);

  useEffect(() => {
    const loadFormations = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        const result = await getAllFormationsFromFirestore();
        if (!result.error && result.data) {
          setFormations(result.data);
        }
      } catch (error) {
        console.error("Error loading formations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFormations();
  }, [isAdmin, adminLoading]);

  // Handle migrate action from URL
  useEffect(() => {
    if (searchParams.get("action") === "migrate" && !isLoading && formations.length === 0) {
      handleMigrate();
    }
  }, [searchParams, isLoading, formations.length]);

  const handleMigrate = async () => {
    if (isMigrating) return;
    
    setIsMigrating(true);
    setMigrateResult(null);
    
    try {
      const result = await migrateFormationsToFirestore(localFormations);
      setMigrateResult(result);
      
      if (!result.error && result.success > 0) {
        // Reload formations
        const reloadResult = await getAllFormationsFromFirestore();
        if (!reloadResult.error && reloadResult.data) {
          setFormations(reloadResult.data);
        }
      }
    } catch (error) {
      console.error("Error migrating formations:", error);
      setMigrateResult({ success: 0, failed: 0, error: error.message });
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDeleteFormation = async () => {
    if (!deleteModal.formation) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteFormation(deleteModal.formation.id);
      if (!result.error) {
        setFormations(formations.filter(f => f.id !== deleteModal.formation.id));
        setDeleteModal({ isOpen: false, formation: null });
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting formation:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (adminLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement des formations...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formations</h1>
          <p className="text-slate-600 mt-1">{formations.length} formation(s) dans Firestore</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleMigrate}
            disabled={isMigrating}
            className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Migration...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Migrer depuis local
              </>
            )}
          </button>
          <button
            onClick={() => router.push("/admin/formations/new")}
            className="cursor-pointer px-4 py-2 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle formation
          </button>
        </div>
      </div>

      {/* Migration Result */}
      {migrateResult && (
        <div className={`mb-6 p-4 rounded-xl ${
          migrateResult.error 
            ? "bg-red-50 border border-red-200 text-red-700"
            : "bg-green-50 border border-green-200 text-green-700"
        }`}>
          {migrateResult.error ? (
            <p>Erreur lors de la migration: {migrateResult.error}</p>
          ) : (
            <p>Migration terminée: {migrateResult.success} réussie(s), {migrateResult.failed} échec(s)</p>
          )}
        </div>
      )}

      {/* Formations Grid */}
      {formations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formations.map((formation) => (
            <div
              key={formation.id}
              className="cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{formation.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{formation.description}</p>
                  </div>
                  {formation.popular && (
                    <span className="px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full">
                      Populaire
                    </span>
                  )}
                </div>
              </div>
              
              {/* Info */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-500">Prix</p>
                    <p className="text-xl font-bold text-slate-900">{formation.price}€</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Durée</p>
                    <p className="text-xl font-bold text-slate-900">{formation.duration}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    formation.type === "pack" 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {formation.type === "pack" ? "Pack" : "Individuelle"}
                  </span>
                  {formation.modules && (
                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                      {formation.modules.length} module(s)
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/admin/formations/${formation.id}`)}
                    className="cursor-pointer flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, formation })}
                    className="cursor-pointer px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune formation dans Firestore</h3>
          <p className="text-slate-500 mb-6">
            Vous pouvez migrer les formations depuis le fichier local ou en créer de nouvelles.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleMigrate}
              disabled={isMigrating}
              className="cursor-pointer px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Migrer les formations locales ({localFormations.length})
            </button>
            <button
              onClick={() => router.push("/admin/formations/new")}
              className="cursor-pointer px-6 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
            >
              Créer une formation
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, formation: null })}
        onConfirm={handleDeleteFormation}
        title="Supprimer la formation"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.formation?.name}" ? Cette action est irréversible.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}

export default function AdminFormationsPage() {
  return (
    <Suspense fallback={
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
        </div>
      </AdminLayout>
    }>
      <FormationsContent />
    </Suspense>
  );
}


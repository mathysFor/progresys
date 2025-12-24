"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import { 
  getFormationByIdFromFirestore, 
  updateFormation,
  deleteFormation 
} from "../../../../lib/firebase/admin-firestore.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";
import DeleteConfirmModal from "../../../../components/admin/DeleteConfirmModal.js";

export default function EditFormationPage() {
  const router = useRouter();
  const params = useParams();
  const formationId = params.formationId;
  
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  
  const [formation, setFormation] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadFormation = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        const result = await getFormationByIdFromFirestore(formationId);
        if (result.error || !result.data) {
          console.error("Formation not found");
          router.push("/admin/formations");
          return;
        }
        setFormation(result.data);
        setFormData({
          name: result.data.name || "",
          description: result.data.description || "",
          price: result.data.price?.toString() || "",
          priceCents: result.data.priceCents?.toString() || "",
          duration: result.data.duration || "",
          type: result.data.type || "individual",
          popular: result.data.popular || false,
        });
      } catch (error) {
        console.error("Error loading formation:", error);
        router.push("/admin/formations");
      } finally {
        setIsLoading(false);
      }
    };

    loadFormation();
  }, [isAdmin, adminLoading, router, formationId]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    
    // Auto-calculate priceCents when price changes
    if (field === "price" && value) {
      const cents = Math.round(parseFloat(value) * 100);
      setFormData(prev => ({ ...prev, [field]: value, priceCents: cents.toString() }));
    }
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis";
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Le prix doit être supérieur à 0";
    }
    
    if (!formData.duration.trim()) {
      newErrors.duration = "La durée est requise";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        priceCents: parseInt(formData.priceCents) || Math.round(parseFloat(formData.price) * 100),
        duration: formData.duration,
        type: formData.type,
        popular: formData.popular,
      };
      
      const result = await updateFormation(formationId, dataToSave);
      
      if (!result.error) {
        setFormation({ ...formation, ...dataToSave });
        setHasChanges(false);
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error("Error saving formation:", error);
      setErrors({ general: "Erreur lors de la sauvegarde" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteFormation(formationId);
      if (!result.error) {
        router.push("/admin/formations");
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
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!formation) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-500">Formation non trouvée</p>
          <button
            onClick={() => router.push("/admin/formations")}
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
            onClick={() => router.push("/admin/formations")}
            className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Modifier la formation</h1>
            <p className="text-slate-600 mt-1">ID: {formationId}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setDeleteModal(true)}
            className="cursor-pointer px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {errors.general}
            </div>
          )}
          
          {/* ID (read-only) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ID de la formation
            </label>
            <input
              type="text"
              value={formationId}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-slate-500 text-xs mt-1">
              L&apos;ID ne peut pas être modifié
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nom de la formation *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.name ? "border-red-400" : "border-slate-200"
              } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors resize-none"
            />
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.price ? "border-red-400" : "border-slate-200"
                } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors`}
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Durée *
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.duration ? "border-red-400" : "border-slate-200"
                } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors`}
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  checked={formData.type === "individual"}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span className="text-slate-700">Formation individuelle</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="pack"
                  checked={formData.type === "pack"}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-4 h-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span className="text-slate-700">Pack</span>
              </label>
            </div>
          </div>

          {/* Popular */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.popular}
                onChange={(e) => handleChange("popular", e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-slate-700 font-medium">Marquer comme populaire</span>
            </label>
          </div>

          {/* Modules info */}
          {formation.modules && formation.modules.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">Modules</p>
              <p className="text-sm text-slate-500">
                Cette formation contient {formation.modules.length} module(s).
                L&apos;édition des modules se fait directement dans le code pour l&apos;instant.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => router.push("/admin/formations")}
            className="cursor-pointer px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Retour
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="cursor-pointer px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {hasChanges ? "Enregistrer les modifications" : "Aucune modification"}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer la formation"
        message={`Êtes-vous sûr de vouloir supprimer "${formation.name}" ? Cette action est irréversible.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}


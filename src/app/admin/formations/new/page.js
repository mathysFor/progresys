"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import { createFormation } from "../../../../lib/firebase/admin-firestore.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";

export default function NewFormationPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    price: "",
    priceCents: "",
    duration: "",
    type: "individual",
    popular: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    
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
    
    if (!formData.id.trim()) {
      newErrors.id = "L'ID est requis";
    } else if (!/^[a-z0-9-]+$/.test(formData.id)) {
      newErrors.id = "L'ID ne peut contenir que des lettres minuscules, chiffres et tirets";
    }
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        price: parseFloat(formData.price),
        priceCents: parseInt(formData.priceCents) || Math.round(parseFloat(formData.price) * 100),
        modules: [], // Empty modules for new formation
      };
      
      const result = await createFormation(dataToSave);
      
      if (!result.error) {
        router.push("/admin/formations");
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error("Error creating formation:", error);
      setErrors({ general: "Erreur lors de la création" });
    } finally {
      setIsSaving(false);
    }
  };

  if (adminLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
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
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/admin/formations")}
          className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Nouvelle formation</h1>
          <p className="text-slate-600 mt-1">Créer une nouvelle formation</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {errors.general}
            </div>
          )}
          
          {/* ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ID de la formation *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="ex: dci, pack-dci-dda, iobsp-1"
              className={`w-full px-4 py-3 rounded-xl border ${
                errors.id ? "border-red-400" : "border-slate-200"
              } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors`}
            />
            {errors.id && (
              <p className="text-red-500 text-sm mt-1">{errors.id}</p>
            )}
            <p className="text-slate-500 text-xs mt-1">
              Identifiant unique utilisé dans les URLs et la base de données
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
              placeholder="ex: Formation DCI"
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
              placeholder="Description de la formation..."
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
                placeholder="95"
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
                placeholder="ex: 7h, 24 heures"
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
            <p className="text-slate-500 text-xs mt-1 ml-8">
              Les formations populaires sont mises en avant sur la page d&apos;accueil
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            type="button"
            onClick={() => router.push("/admin/formations")}
            className="cursor-pointer px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="cursor-pointer px-6 py-3 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && (
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            Créer la formation
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}


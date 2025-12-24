"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import { createCompany } from "../../../../lib/firebase/companies-firestore.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";

export default function NewCompanyPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    siret: "",
    address: "",
    contactEmail: "",
    contactPhone: "",
    contactName: "",
    credits: 0,
    status: "active",
  });

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      // Will be redirected by useAdminAuth
    }
  }, [isAdmin, adminLoading]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const fieldValue = type === "number" ? parseInt(value) || 0 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Le nom est requis";
    if (!formData.contactEmail.trim()) newErrors.contactEmail = "L'email de contact est requis";
    if (formData.credits < 0) newErrors.credits = "Le nombre de crédits doit être positif";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await createCompany({
        ...formData,
        createdBy: isAdmin ? (await import("../../../../lib/firebase/auth.js")).getCurrentUser()?.uid || "admin" : "",
      });

      if (result.error) {
        setErrors({ general: result.error });
        setIsLoading(false);
        return;
      }

      // Rediriger vers la page de détails
      router.push(`/admin/companies/${result.data.id}`);
    } catch (error) {
      setErrors({ general: error.message || "Erreur lors de la création" });
      setIsLoading(false);
    }
  };

  if (adminLoading) {
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

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/companies")}
            className="cursor-pointer mb-4 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux entreprises
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Créer une entreprise</h1>
          <p className="text-slate-600 mt-1">Remplissez les informations de l'entreprise</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          {errors.general && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                Nom de l'entreprise *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.name ? "border-red-300" : "border-slate-200"
                } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none`}
                required
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* SIRET */}
            <div>
              <label htmlFor="siret" className="block text-sm font-semibold text-slate-700 mb-2">
                SIRET
              </label>
              <input
                id="siret"
                name="siret"
                type="text"
                value={formData.siret}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
              />
            </div>

            {/* Crédits */}
            <div>
              <label htmlFor="credits" className="block text-sm font-semibold text-slate-700 mb-2">
                Nombre de crédits *
              </label>
              <input
                id="credits"
                name="credits"
                type="number"
                min="0"
                value={formData.credits}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.credits ? "border-red-300" : "border-slate-200"
                } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none`}
                required
              />
              {errors.credits && <p className="mt-1 text-sm text-red-600">{errors.credits}</p>}
            </div>

            {/* Adresse */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
                Adresse
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold text-slate-700 mb-2">
                Nom du contact
              </label>
              <input
                id="contactName"
                name="contactName"
                type="text"
                value={formData.contactName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-semibold text-slate-700 mb-2">
                Email de contact *
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.contactEmail ? "border-red-300" : "border-slate-200"
                } focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none`}
                required
              />
              {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>}
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="contactPhone" className="block text-sm font-semibold text-slate-700 mb-2">
                Téléphone de contact
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-2">
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none"
              >
                <option value="active">Active</option>
                <option value="pending">En attente</option>
                <option value="suspended">Suspendue</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Création..." : "Créer l'entreprise"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/companies")}
              className="cursor-pointer px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}


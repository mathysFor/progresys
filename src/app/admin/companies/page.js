"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../lib/hooks/useAdminAuth.js";
import { getAllCompanies, deleteCompany } from "../../../lib/firebase/companies-firestore.js";
import AdminLayout from "../../../components/admin/AdminLayout.js";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal.js";

export default function AdminCompaniesPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, company: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        const result = await getAllCompanies();
        if (!result.error && result.data) {
          setCompanies(result.data);
        }
      } catch (error) {
        console.error("Error loading companies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, [isAdmin, adminLoading]);

  const handleDeleteCompany = async () => {
    if (!deleteModal.company) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteCompany(deleteModal.company.id);
      if (!result.error) {
        setCompanies(companies.filter(c => c.id !== deleteModal.company.id));
        setDeleteModal({ isOpen: false, company: null });
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      suspended: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || styles.pending}`}>
        {status === 'active' ? 'Active' : status === 'pending' ? 'En attente' : 'Suspendue'}
      </span>
    );
  };

  if (adminLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement des entreprises...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Entreprises</h1>
          <p className="text-slate-600 mt-1">{companies.length} entreprise(s) au total</p>
        </div>
        <button
          onClick={() => router.push("/admin/companies/new")}
          className="cursor-pointer px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer une entreprise
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Crédits
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => {
                  const remainingCredits = (company.credits || 0) - (company.usedCredits || 0);
                  return (
                    <tr key={company.id} onClick={() => router.push(`/admin/companies/${company.id}`)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{company.name}</p>
                          {company.siret && (
                            <p className="text-sm text-slate-500">SIRET: {company.siret}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-slate-900">{company.contactEmail}</p>
                          {company.contactPhone && (
                            <p className="text-xs text-slate-500">{company.contactPhone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {remainingCredits} / {company.credits || 0}
                          </p>
                          <p className="text-xs text-slate-500">
                            {company.usedCredits || 0} utilisé{company.usedCredits !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(company.status || 'pending')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600">{formatDate(company.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/companies/${company.id}`)}
                            className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Voir détails"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, company })}
                            className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-500 font-medium mb-4">Aucune entreprise</p>
            <button
              onClick={() => router.push("/admin/companies/new")}
              className="cursor-pointer px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              Créer la première entreprise
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, company: null })}
        onConfirm={handleDeleteCompany}
        title="Supprimer l'entreprise"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteModal.company?.name || "cette entreprise"} ? Cette action est irréversible.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}


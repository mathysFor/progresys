"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAdminAuth } from "../../../../lib/hooks/useAdminAuth.js";
import {
  getCompanyById,
  updateCompany,
  getCompanyCodes,
  generateCompanyCodes,
  getCompanyUsers,
  addCreditsToCompany,
} from "../../../../lib/firebase/companies-firestore.js";
import { auth } from "../../../../lib/firebase/config.js";
import AdminLayout from "../../../../components/admin/AdminLayout.js";

export default function CompanyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId;
  
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [company, setCompany] = useState(null);
  const [codes, setCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailsInput, setEmailsInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        // Load company
        const companyResult = await getCompanyById(companyId);
        if (companyResult.error || !companyResult.data) {
          console.error("Error loading company:", companyResult.error);
          router.push("/admin/companies");
          return;
        }
        setCompany(companyResult.data);
        setEditData(companyResult.data);

        // Load codes
        const codesResult = await getCompanyCodes(companyId);
        if (!codesResult.error && codesResult.data) {
          setCodes(codesResult.data);
        }

        // Load users
        const usersResult = await getCompanyUsers(companyId);
        if (!usersResult.error && usersResult.data) {
          setUsers(usersResult.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAdmin, adminLoading, router, companyId]);

  const handleGenerateCodes = async () => {
    if (!emailsInput.trim()) {
      alert("Veuillez entrer au moins un email");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateCompanyCodes(companyId, emailsInput, isAdmin ? "admin" : "");
      
      if (result.error) {
        alert("Erreur: " + result.error);
        setIsGenerating(false);
        return;
      }

      // Recharger les codes
      const codesResult = await getCompanyCodes(companyId);
      if (!codesResult.error && codesResult.data) {
        setCodes(codesResult.data);
      }

      // Vider le champ
      setEmailsInput("");

      // Envoyer les emails avec les codes via BREVO
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("Utilisateur non authentifié");
        }

        // Obtenir le token Firebase
        const token = await currentUser.getIdToken();

        // Préparer les données pour l'API
        const codesToSend = result.data.map(codeData => ({
          email: codeData.email,
          code: codeData.code
        }));

        // Appeler l'API d'envoi d'emails
        const emailResponse = await fetch("/api/send-company-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            companyId,
            codes: codesToSend
          })
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          throw new Error(emailResult.error || "Erreur lors de l'envoi des emails");
        }

        // Afficher le résultat
        const { summary } = emailResult;
        if (summary.failed === 0) {
          alert(`${summary.success} code(s) généré(s) et ${summary.success} email(s) envoyé(s) avec succès !`);
        } else {
          alert(
            `${summary.success} email(s) envoyé(s) avec succès, ${summary.failed} échec(s).\n\n` +
            `Détails:\n${emailResult.results
              .filter(r => !r.success)
              .map(r => `- ${r.email}: ${r.error}`)
              .join('\n')}`
          );
        }
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        alert(
          `${result.data.length} code(s) généré(s) avec succès, mais erreur lors de l'envoi des emails: ${emailError.message}\n\n` +
          "Les codes sont disponibles dans la liste ci-dessous."
        );
      }
    } catch (error) {
      console.error("Error generating codes:", error);
      alert("Erreur lors de la génération des codes");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateCompany(companyId, editData);
      
      if (!result.error) {
        setCompany({ ...company, ...editData });
        setIsEditing(false);
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error saving company:", error);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCredits = async () => {
    const amount = parseInt(creditsToAdd);
    if (isNaN(amount) || amount <= 0) {
      alert("Veuillez entrer un nombre positif");
      return;
    }

    setIsAddingCredits(true);
    try {
      const result = await addCreditsToCompany(companyId, amount);
      
      if (!result.error) {
        // Recharger les données
        const companyResult = await getCompanyById(companyId);
        if (!companyResult.error && companyResult.data) {
          setCompany(companyResult.data);
        }
        setCreditsToAdd("");
        alert(`${amount} crédit(s) ajouté(s) avec succès`);
      } else {
        alert("Erreur: " + result.error);
      }
    } catch (error) {
      console.error("Error adding credits:", error);
      alert("Erreur lors de l'ajout des crédits");
    } finally {
      setIsAddingCredits(false);
    }
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

  const getStatusBadge = (status) => {
    const styles = {
      active: "bg-green-100 text-green-700",
      pending: "bg-yellow-100 text-yellow-700",
      suspended: "bg-red-100 text-red-700",
    };
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || styles.pending}`}>
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
            <p className="text-slate-500 font-medium">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (!company) {
    return null;
  }

  const remainingCredits = (company.credits || 0) - (company.usedCredits || 0);
  const activeCodes = codes.filter(c => c.status === 'active').length;
  const usedCodes = codes.filter(c => c.status === 'used').length;

  return (
    <AdminLayout>
      <div className="max-w-6xl">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
              <p className="text-slate-600 mt-1">{getStatusBadge(company.status || 'pending')}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
            >
              {isEditing ? "Annuler" : "Modifier"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Company Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Informations</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={editData.name || ""}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">SIRET</label>
                    <input
                      type="text"
                      value={editData.siret || ""}
                      onChange={(e) => setEditData({ ...editData, siret: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email de contact</label>
                    <input
                      type="email"
                      value={editData.contactEmail || ""}
                      onChange={(e) => setEditData({ ...editData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone</label>
                    <input
                      type="tel"
                      value={editData.contactPhone || ""}
                      onChange={(e) => setEditData({ ...editData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Statut</label>
                    <select
                      value={editData.status || "active"}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="pending">En attente</option>
                      <option value="suspended">Suspendue</option>
                    </select>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="cursor-pointer px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-70"
                  >
                    {isSaving ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">SIRET</p>
                      <p className="font-semibold text-slate-900">{company.siret || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-semibold text-slate-900">{company.contactEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Téléphone</p>
                      <p className="font-semibold text-slate-900">{company.contactPhone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Créée le</p>
                      <p className="font-semibold text-slate-900">{formatDate(company.createdAt)}</p>
                    </div>
                  </div>
                  {company.address && (
                    <div>
                      <p className="text-sm text-slate-500">Adresse</p>
                      <p className="font-semibold text-slate-900">{company.address}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Generate Codes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Générer des codes d'accès</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Emails des salariés (un par ligne)
                  </label>
                  <textarea
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                    placeholder="salarie1@example.com&#10;salarie2@example.com&#10;salarie3@example.com"
                    rows={6}
                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none resize-none"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Un code unique sera généré pour chaque email. Les emails seront envoyés automatiquement (à implémenter).
                  </p>
                </div>
                
                <button
                  onClick={handleGenerateCodes}
                  disabled={isGenerating || !emailsInput.trim()}
                  className="cursor-pointer px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? "Génération..." : "Générer les codes et envoyer les emails"}
                </button>
              </div>
            </div>

            {/* Codes List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Codes générés ({codes.length})</h2>
              
              {codes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {codes.map((code) => (
                    <div
                      key={code.id}
                      className={`p-4 rounded-xl border-2 ${
                        code.status === 'active' 
                          ? 'border-green-200 bg-green-50' 
                          : code.status === 'used'
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold text-lg">{code.code}</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              code.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : code.status === 'used'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {code.status === 'active' ? 'Actif' : code.status === 'used' ? 'Utilisé' : 'Expiré'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{code.email}</p>
                          {code.usedAt && (
                            <p className="text-xs text-slate-500 mt-1">Utilisé le {formatDate(code.usedAt)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Aucun code généré</p>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            {/* Credits Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Crédits</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Disponibles</p>
                  <p className="text-3xl font-black text-teal-600">{remainingCredits}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {company.usedCredits || 0} utilisé{company.usedCredits !== 1 ? 's' : ''} sur {company.credits || 0}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ajouter des crédits
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={creditsToAdd}
                      onChange={(e) => setCreditsToAdd(e.target.value)}
                      placeholder="0"
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-teal-400 outline-none"
                    />
                    <button
                      onClick={handleAddCredits}
                      disabled={isAddingCredits || !creditsToAdd}
                      className="cursor-pointer px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-70"
                    >
                      {isAddingCredits ? "..." : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Statistiques</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500">Codes actifs</p>
                  <p className="text-2xl font-bold text-green-600">{activeCodes}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Codes utilisés</p>
                  <p className="text-2xl font-bold text-blue-600">{usedCodes}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Utilisateurs</p>
                  <p className="text-2xl font-bold text-teal-600">{users.length}</p>
                </div>
              </div>
            </div>

            {/* Users List */}
            {users.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Utilisateurs ({users.length})</h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <p className="font-semibold text-slate-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


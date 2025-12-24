"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../../lib/hooks/useAdminAuth.js";
import { getAllUsers, searchUsers, deleteUser } from "../../../lib/firebase/admin-firestore.js";
import AdminLayout from "../../../components/admin/AdminLayout.js";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal.js";

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        const result = await getAllUsers();
        if (!result.error && result.data) {
          setUsers(result.data);
          setFilteredUsers(result.data);
        }
      } catch (error) {
        console.error("Error loading users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isAdmin, adminLoading]);

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = users.filter((user) => {
      const email = (user.email || "").toLowerCase();
      const firstName = (user.firstName || "").toLowerCase();
      const lastName = (user.lastName || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      
      return (
        email.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteUser(deleteModal.user.id);
      if (!result.error) {
        setUsers(users.filter(u => u.id !== deleteModal.user.id));
        setDeleteModal({ isOpen: false, user: null });
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

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (adminLoading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-500 animate-spin" />
            <p className="text-slate-500 font-medium">Chargement des utilisateurs...</p>
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
          <h1 className="text-3xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-600 mt-1">{users.length} utilisateur(s) au total</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Formations
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Inscrit le
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                          {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : "Nom non renseigné"}
                          </p>
                          {user.phone && (
                            <p className="text-sm text-slate-500">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.formations && user.formations.length > 0 ? (
                          user.formations.slice(0, 3).map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-full"
                            >
                              {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-sm">Aucune</span>
                        )}
                        {user.formations && user.formations.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                            +{user.formations.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="cursor-pointer p-2 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Voir détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, user })}
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
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-slate-500 font-medium">
              {searchTerm ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        title="Supprimer l'utilisateur"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteModal.user?.firstName || deleteModal.user?.email || "cet utilisateur"} ? Cette action est irréversible et supprimera également sa progression.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}


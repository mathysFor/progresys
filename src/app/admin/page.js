"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../../lib/hooks/useAdminAuth.js";
import { getAdminStats, getAllUsers, getAllFormationsFromFirestore } from "../../lib/firebase/admin-firestore.js";
import AdminLayout from "../../components/admin/AdminLayout.js";
import StatsCard from "../../components/admin/StatsCard.js";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (adminLoading) return;
      
      if (!isAdmin) {
        // Will be redirected by useAdminAuth
        return;
      }

      try {
        // Load stats
        const statsResult = await getAdminStats();
        if (!statsResult.error) {
          setStats(statsResult.data);
        }

        // Load recent users (last 5)
        const usersResult = await getAllUsers();
        if (!usersResult.error && usersResult.data) {
          setRecentUsers(usersResult.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAdmin, adminLoading]);

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

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Vue d&apos;ensemble de la plateforme</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Utilisateurs"
          value={stats?.totalUsers || 0}
          subtitle={`+${stats?.recentUsers || 0} cette semaine`}
          color="teal"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Formations"
          value={stats?.totalFormations || 0}
          subtitle="Dans Firestore"
          color="blue"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatsCard
          title="Avec formations"
          value={stats?.usersWithFormations || 0}
          subtitle={`${stats?.totalUsers ? Math.round((stats.usersWithFormations / stats.totalUsers) * 100) : 0}% des utilisateurs`}
          color="green"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Formations assignées"
          value={stats?.totalFormationsAssigned || 0}
          subtitle={`${stats?.averageFormationsPerUser || 0} par utilisateur`}
          color="purple"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Utilisateurs récents</h2>
            <button
              onClick={() => router.push("/admin/users")}
              className="cursor-pointer px-2 py-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Voir tous →
            </button>
          </div>
          
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                      {(user.firstName?.[0] || user.email?.[0] || "?").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                    {user.formations?.length || 0} formation(s)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">Aucun utilisateur</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Actions rapides</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push("/admin/users")}
              className="cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Gérer les utilisateurs</p>
                <p className="text-sm text-slate-500">Voir, modifier et supprimer des utilisateurs</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/admin/formations")}
              className="cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Gérer les formations</p>
                <p className="text-sm text-slate-500">Créer, modifier et supprimer des formations</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/admin/companies")}
              className="cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Gérer les entreprises</p>
                <p className="text-sm text-slate-500">Créer et gérer les entreprises et codes d'accès</p>
              </div>
            </button>

            <button
              onClick={() => router.push("/admin/formations?action=migrate")}
              className="cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Migrer les formations</p>
                <p className="text-sm text-slate-500">Importer les formations locales vers Firestore</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}


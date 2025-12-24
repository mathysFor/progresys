"use client";

import { useRouter, usePathname } from "next/navigation";
import { signOut } from "../../lib/firebase/auth.js";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: DashboardIcon },
    { name: "Utilisateurs", href: "/admin/users", icon: UsersIcon },
    { name: "Formations", href: "/admin/formations", icon: FormationsIcon },
    { name: "Entreprises", href: "/admin/companies", icon: CompaniesIcon },
  ];

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-slate-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="cursor-pointer flex items-center gap-3 px-2 py-1 rounded-lg hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">Progresys</span>
              </button>
              <div className="h-6 w-px bg-slate-700" />
              <span className="text-sm font-medium text-slate-400">Administration</span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="cursor-pointer px-2 py-1 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Espace apprenant
              </button>
              <button
                onClick={handleLogout}
                className="cursor-pointer px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-slate-800">
          <div className="flex overflow-x-auto px-4 py-2 gap-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-slate-400"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

// Icons
function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function FormationsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function CompaniesIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}


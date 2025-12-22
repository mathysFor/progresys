"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "../../lib/hooks/useAuthState.js";
import { signIn } from "../../lib/firebase/auth.js";
import { getRegistrationData } from "../../lib/progress/store.js";
import { addFormationsToUser } from "../../lib/firebase/firestore.js";
import { expandFormationsToIndividual } from "../../lib/config/formations.js";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: authUser, loading: authLoading } = useAuthState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // Wait for auth state to be determined
    if (authLoading) {
      return;
    }

    if (authUser) {
      router.push("/dashboard");
      return;
    }

    // Pré-remplir l'email depuis l'URL si présent
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [router, authUser, authLoading, searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      setIsLoading(false);
      return;
    }

    const { user, error: authError } = await signIn(email, password);

    if (authError || !user) {
      setError(authError || "Une erreur est survenue lors de la connexion.");
      setIsLoading(false);
      return;
    }

    // Vérifier s'il y a des formations à ajouter depuis le processus d'inscription
    const registrationData = getRegistrationData();
    if (registrationData && registrationData.formations && registrationData.formations.length > 0) {
      try {
        const formations = registrationData.formations;
        const individualFormations = expandFormationsToIndividual(formations);
        
        if (individualFormations.length > 0) {
          const { error: firestoreError } = await addFormationsToUser(user.uid, individualFormations);
          
          if (firestoreError) {
            console.error("Error adding formations:", firestoreError);
            // Continue anyway, formations will be added later
          }
        }
      } catch (error) {
        console.error("Error processing formations:", error);
        // Continue anyway
      }
    }

    // Successfully logged in, redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-primary" />
        
        {/* Decorative elements - Accentuated Halos */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-160 h-160 bg-white/20 rounded-full blur-[8rem] opacity-70 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-200 h-200 bg-teal-200/20 rounded-full blur-[10rem] opacity-60" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-120 h-120 bg-white/10 rounded-full blur-3xl" />
        </div>
        
        {/* Floating shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/50 rounded-full animate-pulse blur-[1px]" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-white/40 rounded-full animate-pulse blur-[1px]" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white/60 rounded-full animate-pulse blur-[1px]" style={{ animationDelay: "1s" }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-12">
            {/* Logo */}
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-teal-900/20">
              <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Développez vos<br />
              <span className="text-teal-700">compétences</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-md leading-relaxed font-medium">
              Accédez à des formations professionnelles de qualité et suivez votre progression en temps réel.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Formations certifiantes IOBSP, IAS, DDA</span>
            </div>
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Progression sauvegardée automatiquement</span>
            </div>
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Apprenez à votre rythme</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="gradient-primary w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Connexion
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Accédez à votre espace de formation
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Link to registration */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Vous n&apos;avez pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => router.push("/inscription")}
                className="cursor-pointer font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                S&apos;inscrire
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

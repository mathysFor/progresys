"use client";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { isLoggedIn } from "../../lib/progress/store.js";
import { saveRegistrationData } from "../../lib/progress/store.js";
import { getAllFormations, getFormationById } from "../../lib/config/formations.js";

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state - only formations for step 1
  const [formData, setFormData] = useState({
    formations: [], // Array of formation IDs
  });

  // Récupérer toutes les formations depuis la config avec toutes les infos
  const { packs, individual } = getAllFormations();
  const allFormations = [...packs, ...individual];

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isLoggedIn()) {
      router.push("/dashboard");
      return;
    }

    // Lire le paramètre formation depuis l'URL
    const formationParam = searchParams.get("formation");
    if (formationParam) {
      // Vérifier que la formation existe
      const formation = getFormationById(formationParam);
      if (formation) {
        setFormData(prev => ({
          ...prev,
          formations: [formationParam], // Initialize with single formation from URL
        }));
      }
    }
  }, [router, searchParams]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "formation") {
      // Handle formation checkbox selection
      setFormData(prev => {
        const currentFormations = prev.formations || [];
        if (checked) {
          // Add formation if checked
          return {
            ...prev,
            formations: [...currentFormations, value]
          };
        } else {
          // Remove formation if unchecked
          return {
            ...prev,
            formations: currentFormations.filter(id => id !== value)
          };
        }
      });
    }

    // Clear error for formations when user selects
    if (errors.formations) {
      setErrors(prev => ({
        ...prev,
        formations: ""
      }));
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!formData.formations || formData.formations.length === 0) {
      return 0;
    }
    return formData.formations.reduce((total, formationId) => {
      const formation = getFormationById(formationId);
      return total + (formation ? formation.price : 0);
    }, 0);
  };

  const handleContinue = () => {
    // Validate formations
    if (!formData.formations || formData.formations.length === 0) {
      setErrors({ formations: "Veuillez sélectionner au moins une formation" });
      return;
    }

    // Sauvegarder uniquement les formations sélectionnées
    saveRegistrationData({
      formations: formData.formations,
    });

    // Rediriger vers la vérification d'email
    router.push("/inscription/check-email");
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
              Choisissez vos<br />
              <span className="text-teal-700">formations</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-md leading-relaxed font-medium">
              Sélectionnez une ou plusieurs formations pour commencer votre parcours d'apprentissage.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Inscription simple et rapide</span>
            </div>
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Données sécurisées et protégées</span>
            </div>
            <div className="group flex items-center gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-slate-800 font-semibold text-lg">Paiement par société disponible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-slate-50 via-white to-teal-50/30 overflow-y-auto">
        <div className="w-full max-w-2xl">
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
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-4">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span className="text-sm font-semibold text-teal-800">Étape 1 sur 2</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Sélectionnez vos formations
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Choisissez une ou plusieurs formations qui vous intéressent
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Choix des formations */}
            <div>
              
              {/* Packs */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Packs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packs.map((formation) => {
                    const isSelected = formData.formations.includes(formation.id);
                    return (
                      <label
                        key={formation.id}
                        className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50"
                        } ${errors.formations ? "border-red-300" : ""}`}
                      >
                        <div className="relative mt-1">
                          <input
                            type="checkbox"
                            name="formation"
                            value={formation.id}
                            checked={isSelected}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-2 border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer appearance-none checked:bg-teal-600 checked:border-teal-600 relative z-10"
                          />
                          {isSelected && (
                            <svg className="absolute top-0 left-0 w-5 h-5 pointer-events-none z-20" fill="none" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" fill="white" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-sm font-bold block ${
                                isSelected ? "text-teal-700" : "text-slate-700"
                              }`}>
                                {formation.name}
                              </span>
                              {formation.description && (
                                <p className="text-xs text-slate-600 mt-1">{formation.description}</p>
                              )}
                            </div>
                            <span className={`text-lg font-black whitespace-nowrap ${
                              isSelected ? "text-teal-600" : "text-slate-700"
                            }`}>
                              {formation.price}€
                            </span>
                          </div>
                          {formation.duration && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formation.duration}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Formations individuelles */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Formations à l'unité</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {individual.map((formation) => {
                    const isSelected = formData.formations.includes(formation.id);
                    return (
                      <label
                        key={formation.id}
                        className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50"
                        } ${errors.formations ? "border-red-300" : ""}`}
                      >
                        <div className="relative mt-1">
                          <input
                            type="checkbox"
                            name="formation"
                            value={formation.id}
                            checked={isSelected}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-2 border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/20 cursor-pointer appearance-none checked:bg-teal-600 checked:border-teal-600 relative z-10"
                          />
                          {isSelected && (
                            <svg className="absolute top-0 left-0 w-5 h-5 pointer-events-none z-20" fill="none" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" fill="white" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-sm font-bold block ${
                                isSelected ? "text-teal-700" : "text-slate-700"
                              }`}>
                                {formation.name}
                              </span>
                              {formation.description && (
                                <p className="text-xs text-slate-600 mt-1">{formation.description}</p>
                              )}
                            </div>
                            <span className={`text-lg font-black whitespace-nowrap ${
                              isSelected ? "text-teal-600" : "text-slate-700"
                            }`}>
                              {formation.price}€
                            </span>
                          </div>
                          {formation.duration && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{formation.duration}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              {formData.formations.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-black text-teal-600">{calculateTotal()}€</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {formData.formations.length} formation{formData.formations.length > 1 ? 's' : ''} sélectionnée{formData.formations.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {errors.formations && (
                <p className="mt-2 text-sm text-red-600">{errors.formations}</p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isLoading || formData.formations.length === 0}
              className="cursor-pointer w-full py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  En cours...
                </>
              ) : (
                <>
                  Continuer
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Link to login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Vous avez déjà un compte ?{" "}
              <button
                onClick={() => router.push("/login")}
                className="cursor-pointer font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    }>
      <InscriptionContent />
    </Suspense>
  );
}


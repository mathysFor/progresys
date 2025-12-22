"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn } from "../../../lib/progress/store.js";
import { getRegistrationData, saveRegistrationData } from "../../../lib/progress/store.js";
import { signIn, getCurrentUser } from "../../../lib/firebase/auth.js";
import { getUserData } from "../../../lib/firebase/firestore.js";

export default function CheckEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(null);
  const [errors, setErrors] = useState({});
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    // If already logged in, redirect to dashboard
   

    // Récupérer les formations sélectionnées depuis l'étape 1
    const data = getRegistrationData();
    if (!data || !data.formations || data.formations.length === 0) {
      // Si pas de formations sélectionnées, rediriger vers l'étape 1
      router.push("/inscription");
      return;
    }
    setRegistrationData(data);

    // Pré-remplir l'email si présent dans les données
    if (data.email) {
      setEmail(data.email);
    }
  }, [router]);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue) ? "" : "Email invalide";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setEmailExists(null);
    setErrors({});
  };

  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setIsChecking(true);
    setErrors({});

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError });
      setIsChecking(false);
      return;
    }

    try {
      const response = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const result = await response.json();

      if (result.error) {
        setErrors({ general: result.error });
        setIsChecking(false);
        return;
      }

      // Si l'email n'existe pas, rediriger directement vers le formulaire d'inscription
      if (!result.exists) {
        saveRegistrationData({
          ...registrationData,
          email: email.toLowerCase().trim(),
        });
        router.push(`/inscription/register?email=${encodeURIComponent(email.toLowerCase().trim())}`);
        return;
      }

      // Si l'email existe, afficher le formulaire de mot de passe
      setEmailExists(result.exists);
      setIsChecking(false);
    } catch (error) {
      setErrors({ general: "Erreur lors de la vérification de l'email." });
      setIsChecking(false);
    }
  };

  const handleContinueWithEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!password) {
      setErrors({ password: "Le mot de passe est requis." });
      setIsLoading(false);
      return;
    }

    try {
      // Connecter l'utilisateur
      const { user, error: authError } = await signIn(email, password);

      if (authError || !user) {
        setErrors({ password: authError || "Mot de passe incorrect." });
        setIsLoading(false);
        return;
      }

      // Récupérer les données utilisateur depuis Firestore
      const { data: userData } = await getUserData(user.uid);
      
      // Sauvegarder les données complètes (formations + infos utilisateur)
      const completeData = {
        ...registrationData,
        email: email.toLowerCase().trim(),
        lastName: userData?.lastName || "",
        firstName: userData?.firstName || "",
        phone: userData?.phone || "",
        birthDate: userData?.birthDate || "",
        birthPlace: userData?.birthPlace || "",
        address: userData?.address || "",
        paidByCompany: registrationData.paidByCompany || false,
      };
      
      saveRegistrationData(completeData);

      // Rediriger directement vers checkout (l'utilisateur a déjà toutes ses infos)
      router.push("/inscription/checkout");
    } catch (error) {
      setErrors({ general: error.message || "Une erreur est survenue." });
      setIsLoading(false);
    }
  };


  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-primary" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-160 h-160 bg-white/20 rounded-full blur-[8rem] opacity-70 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-200 h-200 bg-teal-200/20 rounded-full blur-[10rem] opacity-60" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-12">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-teal-900/20">
              <svg className="w-10 h-10 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Vérifions votre<br />
              <span className="text-teal-700">email</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-md leading-relaxed font-medium">
              Nous vérifions si vous avez déjà un compte pour simplifier votre inscription.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-slate-50 via-white to-teal-50/30 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="gradient-primary w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-4">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span className="text-sm font-semibold text-teal-800">Étape 1.5 sur 2</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Votre email
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Entrez votre adresse email pour continuer
            </p>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {emailExists === null ? (
            /* Email input form */
            <form onSubmit={handleCheckEmail} className="space-y-5">
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
                    onChange={handleEmailChange}
                    placeholder="votre@email.com"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                      errors.email 
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                        : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChecking}
                className="cursor-pointer w-full py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isChecking ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    Vérifier
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          ) : emailExists ? (
            /* Email exists - show password form */
            <div className="space-y-5">
              <div className="p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl">
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      Vous avez déjà un compte
                    </h3>
                    <p className="text-sm text-slate-600">
                      Un compte existe avec l'adresse <strong>{email}</strong>. Entrez votre mot de passe pour continuer.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContinueWithEmail} className="space-y-5">
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
                      className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                        errors.password 
                          ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                          : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="cursor-pointer w-full py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Continuer avec cet email
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : null}

          {/* Link to go back */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/inscription")}
              className="cursor-pointer text-sm text-slate-600 hover:text-teal-600 transition-colors"
            >
              ← Retour à la sélection des formations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




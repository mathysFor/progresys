"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRegistrationData } from "../../../lib/progress/store.js";
import { createUser } from "../../../lib/firebase/auth.js";
import { saveUserData } from "../../../lib/firebase/firestore.js";
import { expandFormationsToIndividual } from "../../../lib/config/formations.js";

export default function CreatePasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationData, setRegistrationData] = useState(null);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const data = getRegistrationData();
    if (!data) {
      router.push("/inscription");
      return;
    }
    setRegistrationData(data);
  }, [router]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (!/[A-Z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une majuscule.";
    }
    if (!/[a-z]/.test(password)) {
      return "Le mot de passe doit contenir au moins une minuscule.";
    }
    if (!/[0-9]/.test(password)) {
      return "Le mot de passe doit contenir au moins un chiffre.";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setErrors({ password: passwordError });
      setIsLoading(false);
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas." });
      setIsLoading(false);
      return;
    }

    if (!registrationData || !registrationData.email) {
      setErrors({ general: "Données d'inscription manquantes. Veuillez recommencer l'inscription." });
      setIsLoading(false);
      return;
    }

    try {
      // Create Firebase user account
      const { user, error: authError } = await createUser(registrationData.email, formData.password);

      if (authError || !user) {
        setErrors({ general: authError || "Erreur lors de la création du compte." });
        setIsLoading(false);
        return;
      }

      // Save user data to Firestore
      // Support both old format (formation) and new format (formations array)
      const formations = registrationData.formations || (registrationData.formation ? [registrationData.formation] : []);
      
      // Décomposer les packs en formations individuelles
      const individualFormations = expandFormationsToIndividual(formations);
      
      const userData = {
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email ? registrationData.email.toLowerCase().trim() : "",
        phone: registrationData.phone,
        birthDate: registrationData.birthDate,
        birthPlace: registrationData.birthPlace,
        address: registrationData.address,
        formations: individualFormations, // Array de formations individuelles uniquement (packs décomposés)
        paidByCompany: registrationData.paidByCompany || false,
        paymentIntentId: registrationData.paymentIntentId || null,
        paymentStatus: registrationData.paymentStatus || null,
        companyId: registrationData.companyId || null,
        companyCodeId: registrationData.companyCodeId || null,
      };

      const { error: firestoreError } = await saveUserData(user.uid, userData);

      if (firestoreError) {
        setErrors({ general: firestoreError });
        setIsLoading(false);
        return;
      }

      // Si un code d'entreprise a été utilisé, le marquer comme utilisé
      if (registrationData.companyCodeId && registrationData.formations) {
        try {
          const response = await fetch('/api/mark-code-used', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              codeId: registrationData.companyCodeId,
              userId: user.uid,
              formationIds: individualFormations,
            }),
          });
          
          const result = await response.json();
          if (result.error) {
            console.error('Erreur lors de la validation du code:', result.error);
            // Ne pas bloquer l'inscription si la validation du code échoue
          }
        } catch (error) {
          console.error('Erreur lors de la validation du code:', error);
          // Ne pas bloquer l'inscription si la validation du code échoue
        }
      }

      // User is automatically signed in after creation
      // Redirect to dashboard
      router.push("/dashboard");
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h1 className="text-5xl xl:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Créez votre<br />
              <span className="text-teal-700">mot de passe</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-md leading-relaxed font-medium">
              Choisissez un mot de passe sécurisé pour protéger votre compte et accéder à vos formations.
            </p>
          </div>

          {/* Security tips */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white/70 backdrop-blur-lg rounded-2xl px-5 py-4 border border-white/80 shadow-xl">
              <svg className="w-6 h-6 text-teal-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-slate-800 font-semibold text-lg mb-1">Au moins 8 caractères</p>
                <p className="text-slate-600 text-sm">Incluant majuscules, minuscules et chiffres</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="gradient-primary w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Création du mot de passe
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Dernière étape pour finaliser votre compte
            </p>
          </div>

          {/* Error message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-400 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
                  Création du compte...
                </>
              ) : (
                <>
                  Finaliser mon inscription
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


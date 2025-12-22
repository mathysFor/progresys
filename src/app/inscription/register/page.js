"use client";

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic';

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { isLoggedIn } from "../../../lib/progress/store.js";
import { getRegistrationData, saveRegistrationData } from "../../../lib/progress/store.js";
import { getCurrentUser } from "../../../lib/firebase/auth.js";
import { getUserData } from "../../../lib/firebase/firestore.js";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    birthDate: "",
    birthPlace: "",
    address: "",
    email: "",
    paidByCompany: false,
  });

  useEffect(() => {
    const loadData = async () => {
      // Récupérer les formations sélectionnées depuis l'étape 1
      const registrationData = getRegistrationData();
      if (!registrationData || !registrationData.formations || registrationData.formations.length === 0) {
        // Si pas de formations sélectionnées, rediriger vers l'étape 1
        router.push("/inscription");
        return;
      }

      // Lire l'email depuis l'URL si présent
      const emailParam = searchParams.get("email");

      // Si l'utilisateur est authentifié, pré-remplir avec ses données depuis Firestore
      if (isLoggedIn()) {
        const user = getCurrentUser();
        if (user) {
          const { data: userData } = await getUserData(user.uid);
          if (userData) {
            setFormData(prev => ({
              ...prev,
              lastName: userData.lastName || registrationData.lastName || "",
              firstName: userData.firstName || registrationData.firstName || "",
              phone: userData.phone || registrationData.phone || "",
              birthDate: userData.birthDate || registrationData.birthDate || "",
              birthPlace: userData.birthPlace || registrationData.birthPlace || "",
              address: userData.address || registrationData.address || "",
              email: emailParam || userData.email || registrationData.email || "",
              paidByCompany: registrationData.paidByCompany || false,
            }));
            return;
          }
        }
      }

      // Pré-remplir les champs si des données existent déjà
      if (registrationData) {
        setFormData(prev => ({
          ...prev,
          lastName: registrationData.lastName || "",
          firstName: registrationData.firstName || "",
          phone: registrationData.phone || "",
          birthDate: registrationData.birthDate || "",
          birthPlace: registrationData.birthPlace || "",
          address: registrationData.address || "",
          email: emailParam || registrationData.email || "",
          paidByCompany: registrationData.paidByCompany || false,
        }));
      } else if (emailParam) {
        // Si pas de données mais email dans l'URL
        setFormData(prev => ({
          ...prev,
          email: emailParam,
        }));
      }
    };

    loadData();
  }, [router, searchParams]);

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? "" : "Email invalide";
      case "phone":
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        return phoneRegex.test(value) ? "" : "Numéro de téléphone invalide";
      case "birthDate":
        const date = new Date(value);
        const today = new Date();
        if (date > today) return "La date de naissance ne peut pas être dans le futur";
        return value ? "" : "Date de naissance requise";
      default:
        if (Array.isArray(value)) {
          return value.length > 0 ? "" : "Ce champ est obligatoire";
        }
        return value && value.trim ? value.trim() ? "" : "Ce champ est obligatoire" : "Ce champ est obligatoire";
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Récupérer les formations de l'étape 1
    const registrationData = getRegistrationData();
    if (!registrationData || !registrationData.formations || registrationData.formations.length === 0) {
      router.push("/inscription");
      setIsLoading(false);
      return;
    }

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== "paidByCompany") {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    // Sauvegarder les données complètes (formations + infos personnelles)
    const completeData = {
      ...registrationData, // Inclut les formations
      ...formData, // Ajoute les infos personnelles
    };
    saveRegistrationData(completeData);

    // Si payé par société, rediriger directement vers la confirmation
    if (formData.paidByCompany) {
      setTimeout(() => {
        router.push("/inscription/confirmation");
      }, 300);
      return;
    }

    // Sinon, rediriger vers la page de checkout
    router.push("/inscription/checkout");
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
              Vos informations<br />
              <span className="text-teal-700">personnelles</span>
            </h1>
            <p className="text-xl text-slate-700 max-w-md leading-relaxed font-medium">
              Remplissez le formulaire pour finaliser votre inscription et accéder à vos formations.
            </p>
          </div>
          
          {/* Features */}
          <div className="space-y-4">
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

          {/* Back button at top */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/inscription")}
              className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour à la sélection des formations
            </button>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-10">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-4">
              <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
              <span className="text-sm font-semibold text-teal-800">Étape 2 sur 2</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Informations personnelles
            </h2>
            <p className="text-lg text-slate-500 font-medium">
              Remplissez le formulaire pour finaliser votre inscription
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Nom et Prénom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                      errors.lastName 
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                        : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>

              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                      errors.firstName 
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                        : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                Numéro de téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+33 6 12 34 56 78"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                    errors.phone 
                      ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                      : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Date et Lieu de naissance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthDate" className="block text-sm font-semibold text-slate-700 mb-2">
                  Date de naissance <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                      errors.birthDate 
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                        : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.birthDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="birthPlace" className="block text-sm font-semibold text-slate-700 mb-2">
                  Lieu de naissance <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    id="birthPlace"
                    name="birthPlace"
                    type="text"
                    value={formData.birthPlace}
                    onChange={handleChange}
                    placeholder="Paris"
                    className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 ${
                      errors.birthPlace 
                        ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                        : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                    }`}
                  />
                </div>
                {errors.birthPlace && (
                  <p className="mt-1 text-sm text-red-600">{errors.birthPlace}</p>
                )}
              </div>
            </div>

            {/* Adresse postale */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
                Adresse postale <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 pt-4 flex items-start pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Rue de la République, 75001 Paris"
                  rows="2"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-4 outline-none transition-all duration-300 resize-none ${
                    errors.address 
                      ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" 
                      : "border-slate-200 focus:border-teal-400 focus:ring-teal-500/20"
                  }`}
                />
              </div>
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Email */}
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
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jean.dupont@example.com"
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

            {/* Checkbox Formation payée par société */}
            <div className="flex items-start gap-3 pt-2">
              <div className="flex items-center h-5 mt-0.5">
                <input
                  id="paidByCompany"
                  name="paidByCompany"
                  type="checkbox"
                  checked={formData.paidByCompany}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-2 border-slate-300 text-teal-600 focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-0 cursor-pointer transition-all"
                />
              </div>
              <label htmlFor="paidByCompany" className="text-sm font-medium text-slate-700 cursor-pointer">
                Ma formation est payée par une société
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirection...
                </>
              ) : formData.paidByCompany ? (
                <>
                  Finaliser l'inscription
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              ) : (
                <>
                  Passer au paiement
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}


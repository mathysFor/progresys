"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isLoggedIn } from "../lib/progress/store.js";

export default function LandingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("packs");

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const packs = [
    {
      id: "pack-dci-dda-lab",
      name: "Pack DCI + DDA + LAB",
      price: 235,
      duration: "24 heures",
      description: "Formation complète incluant DCI, DDA et LAB",
      popular: true,
      type: "pack",
    },
    {
      id: "pack-dci-dda",
      name: "Pack DCI + DDA",
      price: 225,
      duration: "22h",
      description: "Formation combinant DCI et DDA",
      popular: false,
      type: "pack",
    },
  ];

  const individualTrainings = [
    {
      id: "dci",
      name: "DCI",
      price: 95,
      duration: "7h",
      description: "Formation DCI",
      popular: false,
      type: "individual",
    },
    {
      id: "dda",
      name: "DDA",
      price: 120,
      duration: "15h",
      description: "Formation DDA",
      popular: false,
      type: "individual",
    },
    {
      id: "lab",
      name: "LAB",
      price: 35,
      duration: "2h",
      description: "Formation LAB",
      popular: false,
      type: "individual",
    },
    {
      id: "iobsp-1",
      name: "IOBSP 1",
      price: 495,
      duration: "170h",
      description: "Formation IOBSP niveau 1",
      popular: false,
      type: "individual",
    },
    {
      id: "ias-1",
      name: "IAS 1",
      price: 495,
      duration: "170h",
      description: "Formation IAS niveau 1",
      popular: false,
      type: "individual",
    },
  ];

  const handleGetStarted = (formationId = null) => {
    if (formationId) {
      router.push(`/inscription?formation=${formationId}`);
    } else {
      router.push("/inscription");
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Global decorative background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Main gradient halos */}
        <div className="absolute top-[-20%] right-[-10%] w-[60rem] h-[60rem] bg-gradient-to-br from-teal-100/60 to-cyan-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60rem] h-[60rem] bg-gradient-to-tr from-cyan-100/60 to-teal-100/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-r from-teal-50/50 to-cyan-50/50 rounded-full blur-[80px]" />
        
        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0d9488 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-[15%] left-[10%] w-20 h-20 border-2 border-teal-200/30 rounded-2xl rotate-12 animate-spin" style={{ animationDuration: "30s" }} />
        <div className="absolute top-[60%] right-[15%] w-16 h-16 border-2 border-cyan-200/30 rounded-full animate-bounce" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-[20%] left-[20%] w-12 h-12 bg-gradient-to-br from-teal-200/20 to-cyan-200/20 rounded-lg rotate-45 animate-pulse" style={{ animationDuration: "5s" }} />
        <div className="absolute top-[40%] right-[25%] w-8 h-8 border border-teal-300/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
        
        {/* Gradient lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-teal-200/20 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-200/20 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 sm:px-12 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Progresys</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#formations" className="text-slate-700 hover:text-teal-600 font-medium transition-colors">
              Formations
            </a>
            <a href="#about" className="text-slate-700 hover:text-teal-600 font-medium transition-colors">
              À propos
            </a>
            <button
              onClick={handleLogin}
              className="cursor-pointer text-slate-700 hover:text-teal-600 font-medium transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={handleGetStarted}
              className="cursor-pointer px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Commencer
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleGetStarted}
            className="cursor-pointer md:hidden px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-xl text-sm"
          >
            Commencer
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 sm:px-12 py-20 lg:py-32">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Main Gradient Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-teal-400/25 rounded-full blur-[8rem] animate-pulse" style={{ animationDuration: "6s" }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50rem] h-[50rem] bg-cyan-400/25 rounded-full blur-[10rem] animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-teal-200/40 rounded-full blur-3xl" />
          
          {/* Floating particles */}
          <div className="absolute top-[20%] left-[15%] w-3 h-3 bg-teal-500/40 rounded-full animate-float" style={{ animationDuration: "6s" }} />
          <div className="absolute top-[30%] right-[20%] w-4 h-4 bg-cyan-500/40 rounded-full animate-float" style={{ animationDelay: "1s", animationDuration: "7s" }} />
          <div className="absolute bottom-[35%] left-[25%] w-2 h-2 bg-teal-400/50 rounded-full animate-float" style={{ animationDelay: "2s", animationDuration: "5s" }} />
          <div className="absolute top-[45%] right-[30%] w-5 h-5 bg-gradient-to-br from-teal-400/30 to-cyan-500/30 rounded-full blur-sm animate-float" style={{ animationDelay: "0.5s", animationDuration: "8s" }} />
          <div className="absolute bottom-[25%] right-[15%] w-3 h-3 bg-cyan-400/40 rounded-full animate-float" style={{ animationDelay: "1.5s", animationDuration: "6s" }} />
          <div className="absolute top-[60%] left-[10%] w-4 h-4 bg-teal-300/30 rounded-full animate-float" style={{ animationDelay: "3s", animationDuration: "7s" }} />
          
          {/* Decorative rings */}
          <div className="absolute top-[10%] right-[10%] w-32 h-32 border border-teal-200/30 rounded-full" />
          <div className="absolute top-[10%] right-[10%] w-40 h-40 border border-cyan-200/20 rounded-full" />
          <div className="absolute bottom-[15%] left-[5%] w-24 h-24 border border-teal-200/20 rounded-full" />
          
          {/* Gradient orbs */}
          <div className="absolute top-[5%] left-[40%] w-64 h-64 bg-gradient-to-br from-teal-300/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-[10%] right-[35%] w-48 h-48 bg-gradient-to-tl from-cyan-300/10 to-transparent rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-6">
                <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-semibold text-teal-800">Plateforme de formation en ligne</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Votre plateforme de
                <br />
                <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  progression
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-700 mb-8 leading-relaxed font-medium max-w-2xl">
                Développez vos compétences avec nos formations professionnelles de qualité. 
                Une plateforme conçue pour votre réussite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGetStarted}
                  className="cursor-pointer group px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Commencer maintenant
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    document.getElementById("formations")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="cursor-pointer px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-900 font-semibold text-lg rounded-2xl border-2 border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300"
                >
                  Découvrir les formations
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex items-center gap-8 text-slate-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Certifications reconnues</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">100% en ligne</span>
                </div>
              </div>
            </div>
            
            {/* Hero visual */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Decorative card stack */}
                <div className="absolute -top-4 -left-4 w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl transform rotate-3 opacity-20"></div>
                <div className="absolute -top-2 -left-2 w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl transform rotate-1 opacity-40"></div>
                
                {/* Main card */}
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4 border border-teal-100">
                      <div className="text-3xl font-black text-teal-600 mb-1">7+</div>
                      <div className="text-sm text-slate-600 font-medium">Formations</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-4 border border-cyan-100">
                      <div className="text-3xl font-black text-cyan-600 mb-1">100%</div>
                      <div className="text-sm text-slate-600 font-medium">En ligne</div>
                    </div>
                  </div>
                  
                  {/* Progress preview */}
                  <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">Progression type</span>
                      <span className="text-sm font-bold text-teal-600">68%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full w-[68%] bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Feature list */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700 font-medium">Vidéos haute qualité</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700 font-medium">Quiz interactifs</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-700 font-medium">Certificat de fin de formation</span>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements around card */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 animate-bounce" style={{ animationDuration: "3s" }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100">
                  <svg className="w-5 h-5 text-teal-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-6 sm:px-12 py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group flex items-start gap-4 bg-white/80 backdrop-blur-lg rounded-2xl px-6 py-6 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Formations de qualité</h3>
                <p className="text-slate-600 leading-relaxed">
                  Accédez à des contenus pédagogiques élaborés par des experts du secteur.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 bg-white/80 backdrop-blur-lg rounded-2xl px-6 py-6 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Suivi de progression</h3>
                <p className="text-slate-600 leading-relaxed">
                  Visualisez votre avancement en temps réel et restez motivé dans votre apprentissage.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-4 bg-white/80 backdrop-blur-lg rounded-2xl px-6 py-6 border border-white/80 shadow-xl shadow-teal-900/5 hover:bg-white hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Paiement flexible</h3>
                <p className="text-slate-600 leading-relaxed">
                  Paiement sécurisé ou prise en charge par votre entreprise, selon vos besoins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Courses Section */}
      <section id="formations" className="relative px-6 sm:px-12 py-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30"></div>
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-100/30 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-cyan-100/30 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Nos formations
            </h2>
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              Choisissez la formation qui correspond à vos objectifs professionnels
            </p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-xl border border-slate-200">
              <button
                onClick={() => setActiveTab("packs")}
                className={`cursor-pointer px-8 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                  activeTab === "packs"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
                    : "text-slate-700 hover:text-teal-600"
                }`}
              >
                Packs
              </button>
              <button
                onClick={() => setActiveTab("individual")}
                className={`cursor-pointer px-8 py-3 rounded-xl font-bold text-base transition-all duration-300 ${
                  activeTab === "individual"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30"
                    : "text-slate-700 hover:text-teal-600"
                }`}
              >
                Formations à l'unité
              </button>
            </div>
          </div>

          {/* Training Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeTab === "packs" ? packs : individualTrainings).map((training) => (
              <div
                key={training.id}
                className={`group relative bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 ${
                  training.popular
                    ? "border-teal-500 shadow-2xl shadow-teal-500/20 scale-105"
                    : "border-slate-200 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/10"
                }`}
              >
                {training.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg">
                      Populaire
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{training.name}</h3>
                    <p className="text-slate-600 text-sm font-medium">{training.description}</p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-black text-slate-900">{training.price}€</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">{training.duration}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGetStarted(training.id)}
                    className={`cursor-pointer w-full py-3.5 rounded-xl font-bold transition-all duration-300 ${
                      training.popular
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:-translate-y-0.5"
                        : "bg-slate-100 text-slate-900 hover:bg-gradient-to-r hover:from-teal-500 hover:to-cyan-500 hover:text-white hover:shadow-lg hover:shadow-teal-500/30"
                    }`}
                  >
                    Choisir cette formation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative px-6 sm:px-12 py-20 bg-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[30rem] h-[30rem] bg-teal-50/50 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[25rem] h-[25rem] bg-cyan-50/50 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                À propos de Progresys
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Progresys est une plateforme innovante dédiée à votre développement professionnel. 
                Nous croyons que chaque individu mérite d'avoir accès à des formations de qualité 
                qui lui permettent d'évoluer dans sa carrière.
              </p>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Notre mission est de rendre l'apprentissage accessible, engageant et efficace. 
                Avec des contenus élaborés par des experts et un suivi personnalisé de votre progression, 
                nous vous accompagnons à chaque étape de votre parcours.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-teal-900">Formations certifiantes</span>
                </div>
                <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-teal-900">Experts du secteur</span>
                </div>
                <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm font-semibold text-teal-900">Accès à vie</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border-2 border-slate-100">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Contenu de qualité</h3>
                      <p className="text-slate-600 text-sm">Des formations élaborées par des professionnels expérimentés</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Apprentissage flexible</h3>
                      <p className="text-slate-600 text-sm">Apprenez à votre rythme, quand et où vous voulez</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">Suivi personnalisé</h3>
                      <p className="text-slate-600 text-sm">Visualisez votre progression en temps réel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative px-6 sm:px-12 py-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/30"></div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[35rem] h-[35rem] bg-teal-100/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-0 w-[30rem] h-[30rem] bg-cyan-100/30 rounded-full blur-[100px]" />
          {/* Quote decorations */}
          <svg className="absolute top-20 left-10 w-24 h-24 text-teal-100 opacity-50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <svg className="absolute bottom-20 right-10 w-20 h-20 text-cyan-100 opacity-50 rotate-180" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2 mb-4">
              <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-teal-800">Témoignages</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Ce que disent nos apprenants
            </h2>
            <p className="text-xl text-slate-600 font-medium max-w-2xl mx-auto">
              Découvrez les témoignages de professionnels qui ont transformé leur carrière
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-teal-400 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Une plateforme exceptionnelle ! Les formations sont complètes et le suivi de progression 
                m'aide à rester motivé. Je recommande vivement Progresys."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  M.D
                </div>
                <div>
                  <p className="font-bold text-slate-900">Marie Dubois</p>
                  <p className="text-sm text-slate-600">Formatrice professionnelle</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-teal-400 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "J'ai pu développer mes compétences tout en continuant à travailler. L'interface est intuitive 
                et les contenus sont vraiment de qualité. Excellent investissement !"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  P.M
                </div>
                <div>
                  <p className="font-bold text-slate-900">Pierre Martin</p>
                  <p className="text-sm text-slate-600">Consultant indépendant</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-xl hover:shadow-2xl hover:border-teal-400 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-700 mb-6 leading-relaxed">
                "Le système de progression est génial ! Je peux voir exactement où j'en suis et cela me motive 
                à continuer. Les formations sont très bien structurées."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                  S.L
                </div>
                <div>
                  <p className="font-bold text-slate-900">Sophie Laurent</p>
                  <p className="text-sm text-slate-600">Responsable formation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative px-6 sm:px-12 py-20 bg-white overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-px h-1/2 bg-gradient-to-b from-transparent via-teal-200/50 to-transparent" />
          <div className="absolute top-1/2 right-0 w-px h-1/2 bg-gradient-to-b from-transparent via-cyan-200/50 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-full px-4 py-2 mb-4">
              <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold text-cyan-800">FAQ</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Questions fréquentes
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              Tout ce que vous devez savoir sur Progresys
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "Comment fonctionne l'inscription ?",
                answer: "L'inscription est simple et rapide. Remplissez le formulaire avec vos informations personnelles, choisissez votre formation, et procédez au paiement. Vous recevrez immédiatement l'accès à votre espace de formation.",
              },
              {
                question: "Puis-je payer par entreprise ?",
                answer: "Oui, absolument ! Lors de l'inscription, vous pouvez cocher l'option 'Formation payée par une société'. Dans ce cas, vous serez redirigé vers une page de confirmation sans passer par le paiement en ligne.",
              },
              {
                question: "Combien de temps ai-je accès aux formations ?",
                answer: "Une fois inscrit, vous avez un accès à vie à vos formations. Vous pouvez apprendre à votre rythme et revenir sur les contenus autant de fois que nécessaire.",
              },
              {
                question: "Les formations sont-elles certifiantes ?",
                answer: "Oui, toutes nos formations délivrent une certification à la fin du parcours. Ces certifications sont reconnues dans le secteur professionnel et peuvent être ajoutées à votre CV.",
              },
              {
                question: "Puis-je suivre plusieurs formations en même temps ?",
                answer: "Absolument ! Vous pouvez vous inscrire à autant de formations que vous le souhaitez. Chaque formation est indépendante et vous pouvez les suivre simultanément.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-slate-50 rounded-2xl p-6 border-2 border-slate-200 hover:border-teal-400 transition-all duration-300"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 sm:px-12 py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute inset-0">
          {/* Animated background elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-white/10 rounded-full blur-3xl animate-glow" />
          <div className="absolute top-0 left-0 w-[30rem] h-[30rem] bg-teal-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-cyan-400/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/20 rounded-full animate-float" style={{ animationDuration: "5s" }} />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white/30 rounded-full animate-float" style={{ animationDelay: "1s", animationDuration: "6s" }} />
          <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-white/15 rounded-full animate-float" style={{ animationDelay: "2s", animationDuration: "7s" }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white/25 rounded-full animate-float" style={{ animationDelay: "0.5s", animationDuration: "4s" }} />
          
          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            <span className="text-sm font-semibold text-white">Commencez aujourd'hui</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            Prêt à commencer votre parcours ?
          </h2>
          <p className="text-xl text-white/90 mb-10 font-medium max-w-2xl mx-auto">
            Rejoignez des centaines de professionnels qui développent leurs compétences avec Progresys
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="cursor-pointer group px-8 py-4 bg-white text-teal-600 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              S'inscrire maintenant
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              onClick={() => document.getElementById("formations")?.scrollIntoView({ behavior: "smooth" })}
              className="cursor-pointer px-8 py-4 bg-transparent text-white font-semibold text-lg rounded-2xl border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
            >
              Voir les formations
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-6 sm:px-12 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold">Progresys</span>
            </div>
            <div className="flex items-center gap-6 text-slate-400">
              <a href="#formations" className="hover:text-white transition-colors">
                Formations
              </a>
              <a href="#about" className="hover:text-white transition-colors">
                À propos
              </a>
              <button onClick={handleLogin} className="cursor-pointer hover:text-white transition-colors">
                Connexion
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>© 2024 Progresys. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

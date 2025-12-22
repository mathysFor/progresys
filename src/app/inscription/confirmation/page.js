"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getRegistrationData } from "../../../lib/progress/store.js";

import { getFormationById } from "../../../lib/config/formations.js";
import { getCurrentUser } from "../../../lib/firebase/auth.js";
import { addFormationsToUser } from "../../../lib/firebase/firestore.js";
import { expandFormationsToIndividual } from "../../../lib/config/formations.js";

export default function ConfirmationPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [registrationData, setRegistrationData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasRedirected = useRef(false);

  // Effect pour charger les données au montage
  useEffect(() => {
    setIsMounted(true);
    
    const data = getRegistrationData();
    if (!data) {
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.push("/inscription");
      }
      return;
    }
    setRegistrationData(data);

    // Vérifier l'état d'authentification avec Firebase Auth directement
    const user = getCurrentUser();
    // Vérifier si l'utilisateur est authentifié ET si son email correspond à l'email de l'inscription
    const authenticated = user !== null && user.email && data.email && 
                         user.email.toLowerCase().trim() === data.email.toLowerCase().trim();
    setIsAuthenticated(authenticated);

    // Si l'utilisateur est authentifié, ajouter les formations à son profil
    // (pour payé par société ou si les formations n'ont pas été ajoutées dans checkout)
    const addFormationsIfNeeded = async () => {
      if (authenticated && user) {
        try {
          const formations = data.formations || [];
          console.log('[Confirmation] Formations à ajouter:', formations);
          
          if (formations.length === 0) {
            console.warn('[Confirmation] Aucune formation trouvée dans registrationData');
            return;
          }
          
          const individualFormations = expandFormationsToIndividual(formations);
          console.log('[Confirmation] Formations individuelles après expansion:', individualFormations);
          
          if (individualFormations.length > 0) {
            const result = await addFormationsToUser(user.uid, individualFormations);
            if (result.error) {
              console.error('[Confirmation] Erreur lors de l\'ajout des formations:', result.error);
            } else {
              console.log('[Confirmation] Formations ajoutées avec succès pour l\'utilisateur:', user.uid);
            }
          } else {
            console.warn('[Confirmation] Aucune formation individuelle après expansion');
          }
        } catch (error) {
          console.error('[Confirmation] Erreur lors de l\'ajout des formations:', error);
        }
      }
    };

    addFormationsIfNeeded();
  }, [router]);

  // Effect séparé pour le countdown (ne fait que décrémenter)
  useEffect(() => {
    if (!registrationData) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [registrationData]);

  // Effect séparé pour la redirection quand countdown atteint 0
  useEffect(() => {
    if (countdown === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      // Vérifier l'état d'authentification directement avec Firebase Auth
      const user = getCurrentUser();
      const data = getRegistrationData();
      
      // Vérifier si l'utilisateur est authentifié ET si son email correspond à l'email de l'inscription
      const isUserAuthenticated = user !== null && user.email && data && data.email && 
                                  user.email.toLowerCase().trim() === data.email.toLowerCase().trim();
      
      // Si l'utilisateur est déjà authentifié avec le bon email, rediriger vers le dashboard
      // Sinon, rediriger vers la création du mot de passe (nouveau compte)
      if (isUserAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/inscription/create-password");
      }
    }
  }, [countdown, router]);

  // Ne rien afficher tant que le composant n'est pas monté
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas de données, ne rien afficher (redirection en cours)
  if (!registrationData) {
    return null;
  }

  const handleContinue = () => {
    // Vérifier l'état d'authentification directement avec Firebase Auth
    const user = getCurrentUser();
    const data = getRegistrationData();
    
    // Vérifier si l'utilisateur est authentifié ET si son email correspond à l'email de l'inscription
    const isUserAuthenticated = user !== null && user.email && data && data.email && 
                                user.email.toLowerCase().trim() === data.email.toLowerCase().trim();
    
    // Si l'utilisateur est déjà authentifié avec le bon email, rediriger vers le dashboard
    // Sinon, rediriger vers la création du mot de passe (nouveau compte)
    if (isUserAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/inscription/create-password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-slate-50 via-white to-teal-50/30">
      <div className="w-full max-w-2xl">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl shadow-teal-900/10 border border-white/60 p-8 lg:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-linear-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Inscription réussie !
          </h1>

          {/* Message */}
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            Votre inscription est confirmée. {isAuthenticated 
              ? `Vous allez être redirigé vers votre tableau de bord dans ${countdown} seconde${countdown > 1 ? "s" : ""}.`
              : `Vous allez être redirigé pour créer votre mot de passe dans ${countdown} seconde${countdown > 1 ? "s" : ""}.`
            }
          </p>

          {/* Registration Summary (optional) */}
          {registrationData && (() => {
            // Support both old format (formation) and new format (formations array)
            const formationIds = registrationData.formations || (registrationData.formation ? [registrationData.formation] : []);
            const selectedFormations = formationIds.map(id => getFormationById(id)).filter(f => f !== null);
            const totalPrice = selectedFormations.reduce((sum, f) => sum + f.price, 0);
            
            return (
              <div className="mb-8 p-6 bg-teal-50/50 rounded-2xl border border-teal-100 text-left">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Récapitulatif de votre inscription</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedFormations.length > 0 && (
                    <div className="md:col-span-2">
                      <span className="text-slate-500 font-medium">Formation{selectedFormations.length > 1 ? 's' : ''} :</span>
                      <div className="mt-2 space-y-2">
                        {selectedFormations.map((formation) => (
                          <div key={formation.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <span className="text-slate-900 font-semibold">{formation.name}</span>
                            <span className="text-teal-600 font-bold">{formation.price}€</span>
                          </div>
                        ))}
                        {selectedFormations.length > 1 && (
                          <div className="flex items-center justify-between p-2 bg-teal-100 rounded-lg mt-2 border-2 border-teal-200">
                            <span className="text-slate-900 font-bold">Total</span>
                            <span className="text-teal-600 font-black text-lg">{totalPrice}€</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                <div>
                  <span className="text-slate-500 font-medium">Nom :</span>
                  <p className="text-slate-900 font-semibold">{registrationData.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Prénom :</span>
                  <p className="text-slate-900 font-semibold">{registrationData.firstName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email :</span>
                  <p className="text-slate-900 font-semibold">{registrationData.email}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Téléphone :</span>
                  <p className="text-slate-900 font-semibold">{registrationData.phone}</p>
                </div>
                {registrationData.paidByCompany && (
                  <div className="md:col-span-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-700">
                      Formation payée par une société
                    </span>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* Button */}
          <button
            onClick={handleContinue}
            className="cursor-pointer inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-1 transition-all duration-300"
          >
            {isAuthenticated ? "Aller au tableau de bord" : "Créer mon mot de passe"}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


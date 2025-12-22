"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getRegistrationData, saveRegistrationData } from "../../../lib/progress/store.js";
import { getFormationById } from "../../../lib/config/formations.js";
import { getCurrentUser } from "../../../lib/firebase/auth.js";
import { addFormationsToUser } from "../../../lib/firebase/firestore.js";
import { expandFormationsToIndividual } from "../../../lib/config/formations.js";
import PaymentForm from "../../../components/PaymentForm.js";

// Initialiser Stripe avec votre clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [registrationData, setRegistrationData] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Récupérer les données d'inscription
    const data = getRegistrationData();
    
    // Vérifier si une formation est passée dans l'URL (lien direct)
    const formationParam = searchParams.get("formation");
    
    // Support both old format (formation) and new format (formations array)
    const formationIds = data?.formations || (data?.formation ? [data.formation] : []);
    
    if (!data || formationIds.length === 0) {
      // Si pas de données ou pas de formations, rediriger vers l'étape 1
      if (formationParam) {
        const formation = getFormationById(formationParam);
        if (formation) {
          router.push(`/inscription?formation=${formationParam}`);
          return;
        }
      }
      // Sinon, rediriger vers l'inscription normale
      router.push("/inscription");
      return;
    }

    // Si déjà payé par société, rediriger vers confirmation
    if (data.paidByCompany) {
      router.push("/inscription/confirmation");
      return;
    }

    setRegistrationData(data);

    // Créer le Payment Intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formationIds: formationIds, // Already extracted above
            email: data.email,
            metadata: {
              lastName: data.lastName,
              firstName: data.firstName,
              phone: data.phone,
            },
          }),
        });

        const result = await response.json();

        if (result.error) {
          setError(result.error);
        } else {
          setClientSecret(result.clientSecret);
          setPaymentAmount(result.amount);
        }
      } catch (err) {
        setError("Erreur lors de la création du paiement");
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [router, searchParams]);

  const handlePaymentSuccess = async (paymentIntent) => {
    // Mettre à jour les données avec les infos de paiement
    const updatedData = {
      ...registrationData,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      paidAt: new Date().toISOString(),
    };
    
    saveRegistrationData(updatedData);
    
    // Si l'utilisateur est authentifié, ajouter les formations à son profil
    const user = getCurrentUser();
    if (user) {
      try {
        const formations = registrationData.formations || [];
        console.log('[Checkout] Formations à ajouter:', formations);
        
        if (formations.length === 0) {
          console.warn('[Checkout] Aucune formation trouvée dans registrationData');
        } else {
          const individualFormations = expandFormationsToIndividual(formations);
          console.log('[Checkout] Formations individuelles après expansion:', individualFormations);
          
          if (individualFormations.length > 0) {
            const result = await addFormationsToUser(user.uid, individualFormations);
            if (result.error) {
              console.error('[Checkout] Erreur lors de l\'ajout des formations:', result.error);
            } else {
              console.log('[Checkout] Formations ajoutées avec succès pour l\'utilisateur:', user.uid);
            }
          } else {
            console.warn('[Checkout] Aucune formation individuelle après expansion');
          }
        }
      } catch (error) {
        console.error('[Checkout] Erreur lors de l\'ajout des formations:', error);
      }
    } else {
      console.log('[Checkout] Utilisateur non authentifié, les formations seront ajoutées lors de la création du compte');
    }
    
    // Rediriger vers la confirmation
    router.push("/inscription/confirmation");
  };

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleCancel = () => {
    router.push("/inscription");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-[#00BCD4] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Chargement du paiement...</p>
        </div>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-slate-50 via-white to-teal-50/30">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Erreur</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={handleCancel}
            className="cursor-pointer px-6 py-3 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors"
          >
            Retour à l'inscription
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret || !registrationData) {
    return null;
  }

  // Récupérer les informations des formations depuis la config
  // Support both old format (formation) and new format (formations array)
  const formationIds = registrationData.formations || (registrationData.formation ? [registrationData.formation] : []);
  const selectedFormations = formationIds.map(id => getFormationById(id)).filter(f => f !== null);
  const totalPrice = selectedFormations.reduce((sum, f) => sum + f.price, 0);

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Summary */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-160 h-160 bg-white/20 rounded-full blur-[8rem] opacity-70 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-200 h-200 bg-teal-200/20 rounded-full blur-[10rem] opacity-60" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            
            <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-tight mb-4">
              Paiement sécurisé
            </h1>
            <p className="text-lg text-slate-700">
              Finalisez votre inscription en toute sécurité
            </p>
          </div>
          
          {/* Order Summary */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/60 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Récapitulatif</h2>
            <div className="space-y-4">
              {/* Formations list */}
              <div>
                <span className="text-slate-600 text-sm mb-2 block">Formations ({selectedFormations.length})</span>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedFormations.map((formation) => (
                    <div key={formation.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{formation.name}</span>
                        <span className="font-bold text-teal-600 text-sm">{formation.price}€</span>
                      </div>
                      {formation.description && (
                        <p className="text-xs text-slate-500 mt-1">{formation.description}</p>
                      )}
                      {formation.duration && (
                        <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formation.duration}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600">Étudiant</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {registrationData.firstName} {registrationData.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Email</span>
                  <span className="text-sm text-slate-700 text-right">{registrationData.email}</span>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-black text-teal-600">{paymentAmount}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Payment Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-linear-to-br from-slate-50 via-white to-teal-50/30 overflow-y-auto">
        <Elements 
          stripe={stripePromise}
          options={{ 
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#14b8a6', // teal-500
                colorBackground: '#ffffff',
                colorText: '#111827',
                colorDanger: '#ef4444',
                fontFamily: 'Arial, Helvetica, sans-serif',
                spacingUnit: '4px',
                borderRadius: '12px',
              },
            },
          }}
        >
          <PaymentForm 
            formData={registrationData}
            clientSecret={clientSecret}
            amount={paymentAmount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleCancel}
          />
        </Elements>
      </div>
    </div>
  );
}


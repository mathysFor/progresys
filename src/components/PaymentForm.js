"use client";

import { useState, useEffect } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

export default function PaymentForm({ 
  formData, 
  clientSecret, 
  amount,
  onSuccess, 
  onError,
  onCancel 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: formData.email,
        },
        redirect: "if_required", // Ne redirige pas si le paiement est confirmé
      });

      if (error) {
        setErrorMessage(error.message || "Une erreur est survenue lors du paiement");
        onError?.(error.message);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess?.(paymentIntent);
      }
    } catch (err) {
      const message = err.message || "Une erreur est survenue";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Paiement
        </h2>
        <p className="text-base text-slate-500 font-medium">
          Montant total : <span className="font-bold text-teal-600">{amount}€</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <PaymentElement />
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="flex-1 px-6 py-3 rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 text-white font-bold text-lg shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Traitement...
              </span>
            ) : (
              `Payer ${amount}€`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


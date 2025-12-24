"use client";

import { useEffect, useState } from "react";

export default function InactivityWarning({ 
  timeUntilLogout, 
  onStayActive, 
  className = "",
  ...props 
}) {
  const [countdown, setCountdown] = useState(Math.ceil(timeUntilLogout / 1000));

  useEffect(() => {
    if (timeUntilLogout === null || timeUntilLogout <= 0) return;

    setCountdown(Math.ceil(timeUntilLogout / 1000));

    const interval = setInterval(() => {
      const remaining = Math.ceil(timeUntilLogout / 1000);
      setCountdown(Math.max(0, remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilLogout]);

  if (timeUntilLogout === null || timeUntilLogout <= 0) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 ${className}`}
      {...props}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-pulse">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Inactivité détectée
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Vous allez être déconnecté dans
          </p>

          {/* Countdown */}
          <div className="text-6xl font-bold text-red-600 mb-6">
            {countdown}
          </div>

          {/* Subtitle */}
          <p className="text-sm text-gray-500 mb-6">
            {countdown === 1 ? 'seconde' : 'secondes'}
          </p>

          {/* Button */}
          <button
            onClick={onStayActive}
            className="cursor-pointer w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Rester connecté
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Cliquez sur le bouton pour continuer votre session
          </p>
        </div>
      </div>
    </div>
  );
}


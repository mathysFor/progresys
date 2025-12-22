"use client";

import { useState, useEffect } from "react";
import { onAuthStateChange } from "../firebase/auth.js";

/**
 * Hook to get the current authentication state
 * Waits for Firebase Auth to restore the session before returning
 * @returns {{user: User|null, loading: boolean}}
 */
export function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "./useAuthState.js";
import { checkIsAdmin } from "../firebase/admin-firestore.js";

/**
 * Hook to check if user is admin and protect admin routes
 * @returns {{isAdmin: boolean, loading: boolean, user: User|null}}
 */
export function useAdminAuth() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthState();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) {
        return;
      }

      // If not authenticated, redirect to login
      if (!authUser) {
        router.push("/login");
        return;
      }

      // Check if user is admin
      try {
        const result = await checkIsAdmin(authUser.uid);
        if (result.error) {
          console.error("Error checking admin:", result.error);
          router.push("/dashboard");
          return;
        }

        if (!result.isAdmin) {
          // User is not admin, redirect to dashboard
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error in admin check:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [authUser, authLoading, router]);

  return { isAdmin, loading: loading || authLoading, user: authUser };
}


"use client";

import { useEffect, useRef } from "react";
import { useAuthState } from "./useAuthState.js";
import { logLogin, logLogout, initializeSessionTracking } from "../firebase/session-tracking.js";

/**
 * Hook to automatically track user login/logout sessions
 * Handles explicit logouts and navigation-based logouts
 */
export function useSessionTracking() {
  const { user, loading } = useAuthState();
  const sessionIdRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const previousUserIdRef = useRef(user?.uid);

  // Handle login tracking
  useEffect(() => {
    if (loading) return;

    const handleLogin = async () => {
      if (user && !hasInitializedRef.current) {
        try {
          // Initialize session tracking (creates session if none exists)
          await initializeSessionTracking(user.uid);
          hasInitializedRef.current = true;

          // Get the active session ID for logout tracking
          const { getActiveSession } = await import("../firebase/session-tracking.js");
          const activeSessionResult = await getActiveSession(user.uid);
          if (activeSessionResult.data) {
            sessionIdRef.current = activeSessionResult.data.id;
          }
        } catch (error) {
          console.error("Error initializing session tracking:", error);
        }
      }
    };

    handleLogin();
  }, [user, loading]);

  // Handle logout tracking on unmount or user change
  useEffect(() => {
    if (loading) return;

    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = user?.uid;

    return () => {
      if (previousUserId && (!user || user.uid !== previousUserId)) {
        // User logged out
        if (sessionIdRef.current) {
          logLogout(previousUserId, sessionIdRef.current, "navigation").catch((error) => {
            console.error("Error logging logout on unmount:", error);
          });
        }
      }
    };
  }, [user, loading]);

  // Handle page visibility changes (tab switch, minimize, etc.)
  useEffect(() => {
    if (!user || loading) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        // Page is hidden, log logout as navigation
        if (sessionIdRef.current) {
          try {
            await logLogout(user.uid, sessionIdRef.current, "navigation");
            sessionIdRef.current = null;
          } catch (error) {
            console.error("Error logging logout on visibility change:", error);
          }
        }
      } else if (document.visibilityState === "visible") {
        // Page is visible again, check if we need to create a new session
        if (!sessionIdRef.current) {
          try {
            const { getActiveSession } = await import("../firebase/session-tracking.js");
            const activeSessionResult = await getActiveSession(user.uid);
            if (!activeSessionResult.data) {
              // No active session, create one
              const loginResult = await logLogin(user.uid);
              if (loginResult.data) {
                sessionIdRef.current = loginResult.data.id;
              }
            } else {
              sessionIdRef.current = activeSessionResult.data.id;
            }
          } catch (error) {
            console.error("Error handling visibility change:", error);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, loading]);

  // Handle page unload (browser close, navigation away)
  useEffect(() => {
    if (!user || loading) return;

    const handleBeforeUnload = async () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for more reliable logout tracking on page unload
        // Note: We can't use async/await here, so we'll log synchronously if possible
        // For now, we'll rely on the visibility change handler and server-side cleanup
        try {
          // Try to log logout, but don't wait for it
          logLogout(user.uid, sessionIdRef.current, "navigation").catch(() => {
            // Ignore errors on page unload
          });
        } catch (error) {
          // Ignore errors on page unload
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user, loading]);

  // Expose function to explicitly log logout (for manual logout button)
  const trackExplicitLogout = async () => {
    if (user && sessionIdRef.current) {
      try {
        await logLogout(user.uid, sessionIdRef.current, "explicit");
        sessionIdRef.current = null;
        hasInitializedRef.current = false;
      } catch (error) {
        console.error("Error tracking explicit logout:", error);
      }
    }
  };

  return {
    trackExplicitLogout,
  };
}


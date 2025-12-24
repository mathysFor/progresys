// Session tracking service for Firestore
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config.js";

/**
 * Get client IP address by calling the API
 * @returns {Promise<string|null>}
 */
async function getClientIP() {
  try {
    const response = await fetch("/api/get-client-ip");
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.error("Error getting client IP:", error);
    return null;
  }
}

/**
 * Get active session for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getActiveSession(userId) {
  try {
    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(
      sessionsRef,
      where("isActive", "==", true),
      orderBy("loginAt", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { data: null, error: null };
    }
    
    const sessionDoc = querySnapshot.docs[0];
    return {
      data: {
        id: sessionDoc.id,
        ...sessionDoc.data(),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting active session:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération de la session active." };
  }
}

/**
 * Close any active sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
async function closeActiveSessions(userId) {
  try {
    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(
      sessionsRef,
      where("isActive", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    const now = serverTimestamp();
    
    const updatePromises = querySnapshot.docs.map((sessionDoc) => {
      const sessionData = sessionDoc.data();
      let durationSeconds = 0;
      
      try {
        const loginAt = sessionData.loginAt?.toDate?.() || (sessionData.loginAt?.seconds ? new Date(sessionData.loginAt.seconds * 1000) : new Date());
        const logoutAt = new Date();
        durationSeconds = Math.max(0, Math.floor((logoutAt - loginAt) / 1000));
      } catch (e) {
        console.error("Error calculating duration:", e);
      }
      
      return updateDoc(doc(db, "users", userId, "sessions", sessionDoc.id), {
        logoutAt: now,
        durationSeconds,
        isActive: false,
        logoutType: "navigation", // Default to navigation for auto-closed sessions
      });
    });
    
    await Promise.all(updatePromises);
    return { error: null };
  } catch (error) {
    console.error("Error closing active sessions:", error);
    return { error: error.message || "Erreur lors de la fermeture des sessions actives." };
  }
}

/**
 * Log a login event (create a new session)
 * @param {string} userId - User ID
 * @param {string} [ipAddress] - IP address (will be fetched if not provided)
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function logLogin(userId, ipAddress = null) {
  try {
    // Close any active sessions first
    await closeActiveSessions(userId);
    
    // Get IP address if not provided
    let clientIP = ipAddress;
    if (!clientIP) {
      clientIP = await getClientIP();
    }
    
    // Create new session
    const sessionsRef = collection(db, "users", userId, "sessions");
    const sessionRef = doc(sessionsRef);
    
    const sessionData = {
      loginAt: serverTimestamp(),
      logoutAt: null,
      durationSeconds: 0,
      ipAddress: clientIP || "unknown",
      isActive: true,
      logoutType: null,
    };
    
    await setDoc(sessionRef, sessionData);
    
    return {
      data: {
        id: sessionRef.id,
        ...sessionData,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error logging login:", error);
    return { data: null, error: error.message || "Erreur lors de l'enregistrement de la connexion." };
  }
}

/**
 * Log a logout event (close a session)
 * @param {string} userId - User ID
 * @param {string} [sessionId] - Session ID (will use active session if not provided)
 * @param {string} [logoutType] - Type of logout: 'explicit' | 'navigation' | 'timeout'
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function logLogout(userId, sessionId = null, logoutType = "explicit") {
  try {
    let targetSessionId = sessionId;
    
    // If no session ID provided, get the active session
    if (!targetSessionId) {
      const activeSessionResult = await getActiveSession(userId);
      if (activeSessionResult.error || !activeSessionResult.data) {
        return { error: "Aucune session active trouvée." };
      }
      targetSessionId = activeSessionResult.data.id;
    }
    
    // Get session data to calculate duration
    const sessionRef = doc(db, "users", userId, "sessions", targetSessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return { error: "Session non trouvée." };
    }
    
    const sessionData = sessionSnap.data();
    const loginAt = sessionData.loginAt?.toDate?.() || new Date(sessionData.loginAt?.seconds * 1000) || new Date();
    const logoutAt = new Date();
    const durationSeconds = Math.floor((logoutAt - loginAt) / 1000);
    
    // Update session
    await updateDoc(sessionRef, {
      logoutAt: serverTimestamp(),
      durationSeconds,
      isActive: false,
      logoutType,
    });
    
    return { error: null };
  } catch (error) {
    console.error("Error logging logout:", error);
    return { error: error.message || "Erreur lors de l'enregistrement de la déconnexion." };
  }
}

/**
 * Initialize session tracking on page load
 * This should be called when the app initializes to handle browser refreshes
 * @param {string} userId - User ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function initializeSessionTracking(userId) {
  try {
    // Check if there's an active session
    const activeSessionResult = await getActiveSession(userId);
    
    // If no active session, create one
    if (!activeSessionResult.data) {
      await logLogin(userId);
    }
    
    return { error: null };
  } catch (error) {
    console.error("Error initializing session tracking:", error);
    return { error: error.message || "Erreur lors de l'initialisation du tracking de session." };
  }
}


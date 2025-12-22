// Firebase-based progress store
import { getCurrentUser } from "../firebase/auth.js";
import {
  getUserData,
  saveUserData,
  getProgress as getFirestoreProgress,
  saveProgress as saveFirestoreProgress,
  updateCourseProgress as updateFirestoreCourseProgress,
  setLastCourse as setFirestoreLastCourse,
  addUserFormation as addFirestoreUserFormation,
  getFormationProgress as getFirestoreFormationProgress,
} from "../firebase/firestore.js";

/**
 * Get current user from Firebase Auth
 * @returns {User|null}
 */
export function getCurrentFirebaseUser() {
  return getCurrentUser();
}

/**
 * Check if user is logged in with Firebase
 * Note: This may return false if Firebase Auth hasn't restored the session yet.
 * Use onAuthStateChange or wait for auth state to be determined.
 * @returns {boolean}
 */
export function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Wait for auth state to be determined (session restored)
 * @returns {Promise<boolean>} True if user is logged in, false otherwise
 */
export async function waitForAuthState() {
  return new Promise((resolve) => {
    const { onAuthStateChange } = require("../firebase/auth.js");
    const unsubscribe = onAuthStateChange((user) => {
      unsubscribe();
      resolve(user !== null);
    });
  });
}

/**
 * Get user session data (from Firestore)
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getUserSession() {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: null };
  }

  const result = await getUserData(user.uid);
  if (result.error) {
    return { data: null, error: result.error };
  }

  if (!result.data) {
    return { data: null, error: null };
  }

  return {
    data: {
      id: user.uid,
      email: user.email,
      ...result.data,
    },
    error: null,
  };
}

/**
 * Get all progress data from Firestore
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function getProgress() {
  const user = getCurrentUser();
  if (!user) {
    return { data: {}, error: null };
  }

  const result = await getFirestoreProgress(user.uid);
  if (result.error) {
    return { data: {}, error: result.error };
  }

  const progressData = result.data || {};
  return {
    data: progressData.progressByCourseId || {},
    error: null,
  };
}

/**
 * Get progress for a specific course
 * @param {string} courseId - Course ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getCourseProgress(courseId) {
  const progressResult = await getProgress();
  if (progressResult.error) {
    return { data: null, error: progressResult.error };
  }

  const progress = progressResult.data || {};
  return { data: progress[courseId] || null, error: null };
}

/**
 * Update progress for a course
 * @param {string} courseId - Course ID
 * @param {Object} progressData - Progress data object
 * @param {number} progressData.timeSpentSeconds - Time spent in seconds
 * @param {number} progressData.percentComplete - Completion percentage (0-100)
 * @param {number} [progressData.lastVideoPositionSeconds] - Last video position
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateCourseProgress(courseId, progressData) {
  const user = getCurrentUser();
  if (!user) {
    return { error: "Utilisateur non connecté." };
  }

  return await updateFirestoreCourseProgress(user.uid, courseId, progressData);
}

/**
 * Get last accessed course for a formation
 * @param {string} formationId - Formation ID
 * @returns {Promise<{data: string|null, error: null}|{data: null, error: string}>}
 */
export async function getLastCourse(formationId) {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: null };
  }

  const result = await getFirestoreProgress(user.uid);
  if (result.error) {
    return { data: null, error: result.error };
  }

  const progressData = result.data || {};
  const lastCourseByFormationId = progressData.lastCourseByFormationId || {};
  return { data: lastCourseByFormationId[formationId] || null, error: null };
}

/**
 * Set last accessed course for a formation
 * @param {string} formationId - Formation ID
 * @param {string} courseId - Course ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function setLastCourse(formationId, courseId) {
  const user = getCurrentUser();
  if (!user) {
    return { error: "Utilisateur non connecté." };
  }

  return await setFirestoreLastCourse(user.uid, formationId, courseId);
}

/**
 * Get user entitlements (formations souscrites) from user data
 * @returns {Promise<{data: string[], error: null}|{data: null, error: string}>}
 */
export async function getEntitlements() {
  const sessionResult = await getUserSession();
  if (sessionResult.error || !sessionResult.data) {
    return { data: [], error: sessionResult.error };
  }

  // Retourner les formations depuis user.formations (format actuel)
  // Support rétrocompatibilité avec l'ancien format "formation"
  const userData = sessionResult.data;
  
  // Format actuel : "formations" (array)
  if (userData.formations && Array.isArray(userData.formations)) {
    return { data: userData.formations, error: null };
  }
  
  // Rétrocompatibilité : "formation" (array) - ancien format
  if (userData.formation && Array.isArray(userData.formation)) {
    return { data: userData.formation, error: null };
  }
  
  // Rétrocompatibilité : "formation" (string) - très ancien format
  if (userData.formation && typeof userData.formation === 'string') {
    return { data: [userData.formation], error: null };
  }

  return { data: [], error: null };
}

/**
 * Add a formation to current user's formations list
 * @param {string} formationId - Formation ID to add
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function addUserFormation(formationId) {
  const user = getCurrentUser();
  if (!user) {
    return { error: "Utilisateur non connecté." };
  }

  return await addFirestoreUserFormation(user.uid, formationId);
}

/**
 * Get formation progress (time spent) from Firestore
 * @param {string} formationId - Formation ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getFormationProgress(formationId) {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: null };
  }

  return await getFirestoreFormationProgress(user.uid, formationId);
}

/**
 * Clear user session (sign out)
 */
export async function clearUserSession() {
  // This is handled by Firebase Auth signOut
  // This function is kept for compatibility
}


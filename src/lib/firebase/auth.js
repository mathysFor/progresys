// Firebase Authentication service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./config.js";

/**
 * Create a new user account with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: User, error: null}|{user: null, error: string}>}
 */
export async function createUser(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    let errorMessage = "Une erreur est survenue lors de la création du compte.";
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Cet email est déjà utilisé.";
        break;
      case "auth/invalid-email":
        errorMessage = "L'adresse email n'est pas valide.";
        break;
      case "auth/weak-password":
        errorMessage = "Le mot de passe est trop faible. Il doit contenir au moins 6 caractères.";
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{user: User, error: null}|{user: null, error: string}>}
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    let errorMessage = "Une erreur est survenue lors de la connexion.";
    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "Aucun compte trouvé avec cet email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Mot de passe incorrect.";
        break;
      case "auth/invalid-email":
        errorMessage = "L'adresse email n'est pas valide.";
        break;
      case "auth/user-disabled":
        errorMessage = "Ce compte a été désactivé.";
        break;
      case "auth/too-many-requests":
        errorMessage = "Trop de tentatives. Veuillez réessayer plus tard.";
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    return { user: null, error: errorMessage };
  }
}

/**
 * Sign out the current user
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function signOut() {
  try {
    // Log logout before signing out
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const { logLogout, getActiveSession } = await import("./session-tracking.js");
        const activeSessionResult = await getActiveSession(currentUser.uid);
        if (activeSessionResult.data) {
          await logLogout(currentUser.uid, activeSessionResult.data.id, "explicit");
        }
      } catch (sessionError) {
        // Don't block logout if session tracking fails
        console.error("Error logging session logout:", sessionError);
      }
    }

    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message || "Une erreur est survenue lors de la déconnexion." };
  }
}

/**
 * Get the current authenticated user
 * @returns {User|null}
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Observe authentication state changes
 * @param {function} callback - Callback function that receives the user or null
 * @returns {function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}


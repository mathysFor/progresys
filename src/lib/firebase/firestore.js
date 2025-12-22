// Firestore service
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./config.js";
import { getAllCoursesFromFormation, getCourseById } from "../selectors/courses.js";

/**
 * Save user data to Firestore
 * @param {string} userId - User ID
 * @param {Object} userData - User data object
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function saveUserData(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la sauvegarde des données utilisateur." };
  }
}

/**
 * Get user data from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getUserData(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { data: userSnap.data(), error: null };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération des données utilisateur." };
  }
}

/**
 * Save user progress to Firestore
 * @param {string} userId - User ID
 * @param {Object} progress - Progress data object
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function saveProgress(userId, progress) {
  try {
    const progressRef = doc(db, "progress", userId);
    await setDoc(
      progressRef,
      {
        ...progress,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la sauvegarde de la progression." };
  }
}

/**
 * Get user progress from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getProgress(userId) {
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return { data: progressSnap.data(), error: null };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération de la progression." };
  }
}

/**
 * Update course progress for a user
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Object} progressData - Progress data for the course
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateCourseProgress(userId, courseId, progressData) {
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    
    const currentProgress = progressSnap.exists() ? progressSnap.data() : {};
    const progressByCourseId = currentProgress.progressByCourseId || {};
    
    progressByCourseId[courseId] = {
      ...progressByCourseId[courseId],
      ...progressData,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(
      progressRef,
      {
        progressByCourseId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    // Update formation time after course progress update
    const course = getCourseById(courseId);
    if (course && course.formationId) {
      await updateFormationTime(userId, course.formationId);
    }
    
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la mise à jour de la progression." };
  }
}

/**
 * Save last course accessed by formation
 * @param {string} userId - User ID
 * @param {string} formationId - Formation ID
 * @param {string} courseId - Course ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function setLastCourse(userId, formationId, courseId) {
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    
    const currentProgress = progressSnap.exists() ? progressSnap.data() : {};
    const lastCourseByFormationId = currentProgress.lastCourseByFormationId || {};
    
    lastCourseByFormationId[formationId] = courseId;
    
    await setDoc(
      progressRef,
      {
        lastCourseByFormationId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la sauvegarde du dernier cours." };
  }
}

/**
 * Update formation time by recalculating total time from all courses
 * @param {string} userId - User ID
 * @param {string} formationId - Formation ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateFormationTime(userId, formationId) {
  try {
    // Get all courses for this formation
    const allCourses = getAllCoursesFromFormation(formationId);
    if (allCourses.length === 0) {
      return { error: null }; // No courses to calculate
    }

    // Get current progress
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    const currentProgress = progressSnap.exists() ? progressSnap.data() : {};
    const progressByCourseId = currentProgress.progressByCourseId || {};
    
    // Calculate total time spent by summing all course times
    let totalTimeSpent = 0;
    for (const course of allCourses) {
      const courseProgress = progressByCourseId[course.id] || {};
      const timeSpent = courseProgress.timeSpentSeconds || 0;
      totalTimeSpent += timeSpent;
    }
    
    // Update progressByFormationId
    const progressByFormationId = currentProgress.progressByFormationId || {};
    progressByFormationId[formationId] = {
      timeSpentSeconds: totalTimeSpent,
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(
      progressRef,
      {
        progressByFormationId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la mise à jour du temps de formation." };
  }
}

/**
 * Get formation progress from Firestore
 * @param {string} userId - User ID
 * @param {string} formationId - Formation ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getFormationProgress(userId, formationId) {
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    
    if (!progressSnap.exists()) {
      return { data: null, error: null };
    }
    
    const progressData = progressSnap.data();
    const progressByFormationId = progressData.progressByFormationId || {};
    const formationProgress = progressByFormationId[formationId] || null;
    
    return { data: formationProgress, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération du temps de formation." };
  }
}

/**
 * Add a formation to user's formations list
 * @param {string} userId - User ID
 * @param {string} formationId - Formation ID to add
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function addUserFormation(userId, formationId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { error: "Utilisateur non trouvé." };
    }
    
    const userData = userSnap.data();
    // Récupérer les formations existantes (format actuel: "formations" array)
    let currentFormations = [];
    if (userData.formations && Array.isArray(userData.formations)) {
      currentFormations = userData.formations;
    } else if (userData.formation && Array.isArray(userData.formation)) {
      // Rétrocompatibilité : ancien format "formation" (array)
      currentFormations = userData.formation;
    } else if (userData.formation && typeof userData.formation === 'string') {
      // Rétrocompatibilité : très ancien format "formation" (string)
      currentFormations = [userData.formation];
    }
    
    // Vérifier si la formation n'est pas déjà dans la liste
    if (!currentFormations.includes(formationId)) {
      await updateDoc(userRef, {
        formations: [...currentFormations, formationId], // Utiliser "formations" (format actuel)
        updatedAt: serverTimestamp(),
      });
    }
    
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de l'ajout de la formation." };
  }
}

/**
 * Add multiple formations to user's formations list
 * @param {string} userId - User ID
 * @param {string[]} formationIds - Array of formation IDs to add
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function addFormationsToUser(userId, formationIds) {
  try {
    console.log('[Firestore] addFormationsToUser appelé avec:', { userId, formationIds });
    
    if (!formationIds || formationIds.length === 0) {
      console.warn('[Firestore] Aucune formation à ajouter');
      return { error: "Aucune formation à ajouter." };
    }

    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('[Firestore] Utilisateur non trouvé:', userId);
      return { error: "Utilisateur non trouvé." };
    }
    
    const userData = userSnap.data();
    console.log('[Firestore] Données utilisateur actuelles:', { 
      formations: userData.formations, 
      formation: userData.formation 
    });
    
    // Récupérer les formations existantes
    let currentFormations = [];
    if (userData.formations && Array.isArray(userData.formations)) {
      currentFormations = userData.formations;
    } else if (userData.formation && Array.isArray(userData.formation)) {
      currentFormations = userData.formation;
    } else if (userData.formation && typeof userData.formation === 'string') {
      currentFormations = [userData.formation];
    }
    
    console.log('[Firestore] Formations existantes:', currentFormations);
    
    // Filtrer les formations qui ne sont pas déjà dans la liste
    const newFormations = formationIds.filter(id => !currentFormations.includes(id));
    console.log('[Firestore] Nouvelles formations à ajouter:', newFormations);
    
    if (newFormations.length > 0) {
      // Utiliser arrayUnion pour ajouter les nouvelles formations sans doublons
      await updateDoc(userRef, {
        formations: arrayUnion(...newFormations),
        updatedAt: serverTimestamp(),
      });
      console.log('[Firestore] Formations ajoutées avec succès');
    } else {
      console.log('[Firestore] Toutes les formations sont déjà présentes, aucune mise à jour nécessaire');
    }
    
    return { error: null };
  } catch (error) {
    console.error('[Firestore] Erreur lors de l\'ajout des formations:', error);
    return { error: error.message || "Erreur lors de l'ajout des formations." };
  }
}


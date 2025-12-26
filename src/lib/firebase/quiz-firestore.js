// Firestore functions for quiz management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config.js";

/**
 * Get all quiz questions
 * @returns {Promise<{data: Array|null, error: null}|{data: null, error: string}>}
 */
export async function getAllQuizQuestions() {
  try {
    const questionsRef = collection(db, "quiz_questions");
    const q = query(questionsRef, orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    const questions = [];
    querySnapshot.forEach((doc) => {
      questions.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: questions, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération des questions." };
  }
}

/**
 * Get a single quiz question by ID
 * @param {string} questionId
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getQuizQuestion(questionId) {
  try {
    const questionRef = doc(db, "quiz_questions", questionId);
    const questionSnap = await getDoc(questionRef);
    
    if (questionSnap.exists()) {
      return { data: { id: questionSnap.id, ...questionSnap.data() }, error: null };
    } else {
      return { data: null, error: "Question non trouvée." };
    }
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération de la question." };
  }
}

/**
 * Save or update a quiz question
 * @param {string} questionId
 * @param {Object} questionData
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function saveQuizQuestion(questionId, questionData) {
  try {
    const questionRef = doc(db, "quiz_questions", questionId);
    await setDoc(questionRef, {
      ...questionData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la sauvegarde de la question." };
  }
}

/**
 * Create a quiz attempt
 * @param {string} attemptId
 * @param {Object} attemptData
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function createQuizAttempt(attemptId, attemptData) {
  try {
    const attemptRef = doc(db, "quiz_attempts", attemptId);
    await setDoc(attemptRef, {
      ...attemptData,
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la création de la tentative." };
  }
}

/**
 * Update a quiz attempt
 * @param {string} attemptId
 * @param {Object} updateData
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateQuizAttempt(attemptId, updateData) {
  try {
    const attemptRef = doc(db, "quiz_attempts", attemptId);
    await updateDoc(attemptRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la mise à jour de la tentative." };
  }
}

/**
 * Get quiz attempt by ID
 * @param {string} attemptId
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getQuizAttempt(attemptId) {
  try {
    const attemptRef = doc(db, "quiz_attempts", attemptId);
    const attemptSnap = await getDoc(attemptRef);
    
    if (attemptSnap.exists()) {
      return { data: { id: attemptSnap.id, ...attemptSnap.data() }, error: null };
    } else {
      return { data: null, error: "Tentative non trouvée." };
    }
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération de la tentative." };
  }
}

/**
 * Get quiz attempts by email
 * @param {string} email
 * @returns {Promise<{data: Array|null, error: null}|{data: null, error: string}>}
 */
export async function getQuizAttemptsByEmail(email) {
  try {
    const attemptsRef = collection(db, "quiz_attempts");
    const q = query(attemptsRef, where("email", "==", email.toLowerCase().trim()), orderBy("startedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const attempts = [];
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: attempts, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération des tentatives." };
  }
}

/**
 * Get all quiz attempts (admin only)
 * @param {Object} filters - Optional filters { passed, limit }
 * @returns {Promise<{data: Array|null, error: null}|{data: null, error: string}>}
 */
export async function getAllQuizAttempts(filters = {}) {
  try {
    const attemptsRef = collection(db, "quiz_attempts");
    let q = query(attemptsRef, orderBy("completedAt", "desc"));
    
    if (filters.passed !== undefined) {
      q = query(attemptsRef, where("passed", "==", filters.passed), orderBy("completedAt", "desc"));
    }
    
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const querySnapshot = await getDocs(q);
    
    const attempts = [];
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: attempts, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération des tentatives." };
  }
}

/**
 * Subscribe to quiz attempts in real-time (admin only)
 * @param {Function} callback - Callback function that receives attempts array
 * @param {Object} filters - Optional filters
 * @returns {Function} Unsubscribe function
 */
export function subscribeToQuizAttempts(callback, filters = {}) {
  const attemptsRef = collection(db, "quiz_attempts");
  let q = query(attemptsRef, orderBy("completedAt", "desc"));
  
  if (filters.passed !== undefined) {
    q = query(attemptsRef, where("passed", "==", filters.passed), orderBy("completedAt", "desc"));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const attempts = [];
    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    callback(attempts);
  }, (error) => {
    console.error("Error in quiz attempts subscription:", error);
    callback([]);
  });
}

/**
 * Complete a quiz attempt with answers and score
 * @param {string} attemptId
 * @param {Object} completionData - { answers, score, percentage, passed, timeSpentSeconds }
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function completeQuizAttempt(attemptId, completionData) {
  try {
    const attemptRef = doc(db, "quiz_attempts", attemptId);
    await updateDoc(attemptRef, {
      ...completionData,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la finalisation de la tentative." };
  }
}


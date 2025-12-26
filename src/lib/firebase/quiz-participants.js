// Firestore functions for quiz participants management
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config.js";

/**
 * Check if an email is in the participants list
 * @param {string} email
 * @returns {Promise<{isAuthorized: boolean, participant: Object|null, error: null}|{isAuthorized: false, participant: null, error: string}>}
 */
export async function checkParticipantEmail(email) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const participantsRef = collection(db, "quiz_participants");
    const q = query(participantsRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const participantDoc = querySnapshot.docs[0];
      return {
        isAuthorized: true,
        participant: {
          id: participantDoc.id,
          ...participantDoc.data(),
        },
        error: null,
      };
    } else {
      return {
        isAuthorized: false,
        participant: null,
        error: null,
      };
    }
  } catch (error) {
    return {
      isAuthorized: false,
      participant: null,
      error: error.message || "Erreur lors de la vérification de l'email.",
    };
  }
}

/**
 * Get all participants
 * @returns {Promise<{data: Array|null, error: null}|{data: null, error: string}>}
 */
export async function getAllParticipants() {
  try {
    const participantsRef = collection(db, "quiz_participants");
    const querySnapshot = await getDocs(participantsRef);
    
    const participants = [];
    querySnapshot.forEach((doc) => {
      participants.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: participants, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération des participants." };
  }
}

/**
 * Get a participant by ID
 * @param {string} participantId
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getParticipant(participantId) {
  try {
    const participantRef = doc(db, "quiz_participants", participantId);
    const participantSnap = await getDoc(participantRef);
    
    if (participantSnap.exists()) {
      return { data: { id: participantSnap.id, ...participantSnap.data() }, error: null };
    } else {
      return { data: null, error: "Participant non trouvé." };
    }
  } catch (error) {
    return { data: null, error: error.message || "Erreur lors de la récupération du participant." };
  }
}

/**
 * Create or update a participant
 * @param {string} participantId - Usually the email
 * @param {Object} participantData
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function saveParticipant(participantId, participantData) {
  try {
    const participantRef = doc(db, "quiz_participants", participantId);
    await setDoc(participantRef, {
      ...participantData,
      email: participantData.email?.toLowerCase().trim() || participantId.toLowerCase().trim(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la sauvegarde du participant." };
  }
}

/**
 * Update participant's allowed attempts
 * @param {string} participantId
 * @param {number} allowedAttempts
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateParticipantAttempts(participantId, allowedAttempts) {
  try {
    const participantRef = doc(db, "quiz_participants", participantId);
    await updateDoc(participantRef, {
      allowedAttempts,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    return { error: error.message || "Erreur lors de la mise à jour des tentatives autorisées." };
  }
}

/**
 * Import multiple participants
 * @param {Array} participants - Array of participant objects
 * @returns {Promise<{success: number, failed: number, errors: Array}|{error: string}>}
 */
export async function importParticipants(participants) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };
  
  for (const participant of participants) {
    try {
      const email = participant.email?.toLowerCase().trim();
      if (!email) {
        results.failed++;
        results.errors.push({ email: participant.email || "N/A", error: "Email manquant" });
        continue;
      }
      
      // Use email as document ID
      const participantId = email;
      await saveParticipant(participantId, {
        ...participant,
        email,
        allowedAttempts: participant.allowedAttempts || 1,
        createdAt: serverTimestamp(),
      });
      
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: participant.email || "N/A",
        error: error.message || "Erreur inconnue",
      });
    }
  }
  
  return results;
}


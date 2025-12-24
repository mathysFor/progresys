// Admin Firestore service - Functions for managing users and formations
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "./config.js";

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get all users from Firestore
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getAllUsers() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: users, error: null };
  } catch (error) {
    console.error("Error getting all users:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération des utilisateurs." };
  }
}

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getUserById(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { data: { id: userSnap.id, ...userSnap.data() }, error: null };
    } else {
      return { data: null, error: "Utilisateur non trouvé." };
    }
  } catch (error) {
    console.error("Error getting user:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération de l'utilisateur." };
  }
}

/**
 * Update a user
 * @param {string} userId - User ID
 * @param {Object} userData - User data to update
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateUser(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error updating user:", error);
    return { error: error.message || "Erreur lors de la mise à jour de l'utilisateur." };
  }
}

/**
 * Delete a user from Firestore (does not delete from Firebase Auth)
 * @param {string} userId - User ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function deleteUser(userId) {
  try {
    // Delete user document
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
    
    // Also delete progress document
    const progressRef = doc(db, "progress", userId);
    try {
      await deleteDoc(progressRef);
    } catch (e) {
      // Progress might not exist, ignore
    }
    
    return { error: null };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { error: error.message || "Erreur lors de la suppression de l'utilisateur." };
  }
}

/**
 * Add formations to a user
 * @param {string} userId - User ID
 * @param {string[]} formationIds - Array of formation IDs to add
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function addFormationsToUser(userId, formationIds) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { error: "Utilisateur non trouvé." };
    }
    
    const userData = userSnap.data();
    const currentFormations = userData.formations || [];
    
    // Add new formations (avoid duplicates)
    const newFormations = [...new Set([...currentFormations, ...formationIds])];
    
    await updateDoc(userRef, {
      formations: newFormations,
      updatedAt: serverTimestamp(),
    });
    
    return { error: null };
  } catch (error) {
    console.error("Error adding formations to user:", error);
    return { error: error.message || "Erreur lors de l'ajout des formations." };
  }
}

/**
 * Remove formations from a user
 * @param {string} userId - User ID
 * @param {string[]} formationIds - Array of formation IDs to remove
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function removeFormationsFromUser(userId, formationIds) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { error: "Utilisateur non trouvé." };
    }
    
    const userData = userSnap.data();
    const currentFormations = userData.formations || [];
    
    // Remove specified formations
    const newFormations = currentFormations.filter(f => !formationIds.includes(f));
    
    await updateDoc(userRef, {
      formations: newFormations,
      updatedAt: serverTimestamp(),
    });
    
    return { error: null };
  } catch (error) {
    console.error("Error removing formations from user:", error);
    return { error: error.message || "Erreur lors de la suppression des formations." };
  }
}

/**
 * Get user progress from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getUserProgress(userId) {
  try {
    const progressRef = doc(db, "progress", userId);
    const progressSnap = await getDoc(progressRef);
    
    if (progressSnap.exists()) {
      return { data: progressSnap.data(), error: null };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    console.error("Error getting user progress:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération de la progression." };
  }
}

/**
 * Create a new user (for manual creation by admin)
 * @param {string} userId - User ID (usually from Firebase Auth)
 * @param {Object} userData - User data
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function createUser(userId, userData) {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: error.message || "Erreur lors de la création de l'utilisateur." };
  }
}

// ============================================
// FORMATION MANAGEMENT
// ============================================

/**
 * Get all formations from Firestore
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getAllFormationsFromFirestore() {
  try {
    const formationsRef = collection(db, "formations");
    const q = query(formationsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const formations = [];
    querySnapshot.forEach((doc) => {
      formations.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: formations, error: null };
  } catch (error) {
    console.error("Error getting all formations:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération des formations." };
  }
}

/**
 * Get a formation by ID from Firestore
 * @param {string} formationId - Formation ID
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getFormationByIdFromFirestore(formationId) {
  try {
    const formationRef = doc(db, "formations", formationId);
    const formationSnap = await getDoc(formationRef);
    
    if (formationSnap.exists()) {
      return { data: { id: formationSnap.id, ...formationSnap.data() }, error: null };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    console.error("Error getting formation:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération de la formation." };
  }
}

/**
 * Create a new formation in Firestore
 * @param {Object} formationData - Formation data
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function createFormation(formationData) {
  try {
    const formationId = formationData.id || `formation-${Date.now()}`;
    const formationRef = doc(db, "formations", formationId);
    
    const dataToSave = {
      ...formationData,
      id: formationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    await setDoc(formationRef, dataToSave);
    
    return { data: { id: formationId, ...formationData }, error: null };
  } catch (error) {
    console.error("Error creating formation:", error);
    return { data: null, error: error.message || "Erreur lors de la création de la formation." };
  }
}

/**
 * Update a formation in Firestore
 * @param {string} formationId - Formation ID
 * @param {Object} formationData - Formation data to update
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateFormation(formationId, formationData) {
  try {
    const formationRef = doc(db, "formations", formationId);
    await updateDoc(formationRef, {
      ...formationData,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error("Error updating formation:", error);
    return { error: error.message || "Erreur lors de la mise à jour de la formation." };
  }
}

/**
 * Delete a formation from Firestore
 * @param {string} formationId - Formation ID
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function deleteFormation(formationId) {
  try {
    const formationRef = doc(db, "formations", formationId);
    await deleteDoc(formationRef);
    return { error: null };
  } catch (error) {
    console.error("Error deleting formation:", error);
    return { error: error.message || "Erreur lors de la suppression de la formation." };
  }
}

/**
 * Migrate local formations to Firestore
 * @param {Array} formations - Array of formations from local file
 * @returns {Promise<{success: number, failed: number, error: null}|{success: 0, failed: 0, error: string}>}
 */
export async function migrateFormationsToFirestore(formations) {
  try {
    let success = 0;
    let failed = 0;
    
    for (const formation of formations) {
      try {
        const formationRef = doc(db, "formations", formation.id);
        await setDoc(formationRef, {
          ...formation,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        success++;
      } catch (e) {
        console.error(`Failed to migrate formation ${formation.id}:`, e);
        failed++;
      }
    }
    
    return { success, failed, error: null };
  } catch (error) {
    console.error("Error migrating formations:", error);
    return { success: 0, failed: 0, error: error.message || "Erreur lors de la migration." };
  }
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get admin statistics
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function getAdminStats() {
  try {
    // Get users count
    const usersRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersRef);
    const totalUsers = usersSnapshot.size;
    
    // Get formations count from Firestore
    const formationsRef = collection(db, "formations");
    const formationsSnapshot = await getDocs(formationsRef);
    const totalFormations = formationsSnapshot.size;
    
    // Calculate users with formations
    let usersWithFormations = 0;
    let totalFormationsAssigned = 0;
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const formations = userData.formations || [];
      if (formations.length > 0) {
        usersWithFormations++;
        totalFormationsAssigned += formations.length;
      }
    });
    
    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    let recentUsers = 0;
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.createdAt) {
        const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
        if (createdAt >= sevenDaysAgo) {
          recentUsers++;
        }
      }
    });
    
    return {
      data: {
        totalUsers,
        totalFormations,
        usersWithFormations,
        totalFormationsAssigned,
        recentUsers,
        averageFormationsPerUser: totalUsers > 0 ? (totalFormationsAssigned / totalUsers).toFixed(1) : 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting admin stats:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération des statistiques." };
  }
}

/**
 * Search users by email or name
 * @param {string} searchTerm - Search term
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function searchUsers(searchTerm) {
  try {
    // Get all users and filter client-side (Firestore doesn't support full-text search)
    const result = await getAllUsers();
    if (result.error) {
      return result;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const filteredUsers = result.data.filter((user) => {
      const email = (user.email || "").toLowerCase();
      const firstName = (user.firstName || "").toLowerCase();
      const lastName = (user.lastName || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      
      return (
        email.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower)
      );
    });
    
    return { data: filteredUsers, error: null };
  } catch (error) {
    console.error("Error searching users:", error);
    return { data: null, error: error.message || "Erreur lors de la recherche." };
  }
}

/**
 * Check if a user is an admin
 * @param {string} userId - User ID
 * @returns {Promise<{isAdmin: boolean, error: null}|{isAdmin: false, error: string}>}
 */
export async function checkIsAdmin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return { isAdmin: userData.admin === true, error: null };
    } else {
      return { isAdmin: false, error: "Utilisateur non trouvé." };
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAdmin: false, error: error.message || "Erreur lors de la vérification du statut admin." };
  }
}

// ============================================
// SESSION TRACKING
// ============================================

/**
 * Get all sessions for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getUserSessions(userId) {
  try {
    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(sessionsRef, orderBy("loginAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const sessions = [];
    querySnapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: sessions, error: null };
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return { data: null, error: error.message || "Erreur lors de la récupération des sessions." };
  }
}

/**
 * Get session statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function getUserSessionStats(userId) {
  try {
    const sessionsResult = await getUserSessions(userId);
    if (sessionsResult.error) {
      return sessionsResult;
    }
    
    const sessions = sessionsResult.data || [];
    
    if (sessions.length === 0) {
      return {
        data: {
          totalSessions: 0,
          firstLoginAt: null,
          lastLoginAt: null,
          totalDurationSeconds: 0,
          activeSessions: 0,
        },
        error: null,
      };
    }
    
    // Calculate statistics
    const sortedByLogin = [...sessions].sort((a, b) => {
      const aLogin = a.loginAt?.toDate?.() || new Date(a.loginAt?.seconds * 1000) || new Date(0);
      const bLogin = b.loginAt?.toDate?.() || new Date(b.loginAt?.seconds * 1000) || new Date(0);
      return aLogin - bLogin;
    });
    
    const firstLoginAt = sortedByLogin[0]?.loginAt || null;
    const lastLoginAt = sessions[0]?.loginAt || null;
    
    const totalDurationSeconds = sessions.reduce((acc, session) => {
      return acc + (session.durationSeconds || 0);
    }, 0);
    
    const activeSessions = sessions.filter(s => s.isActive === true).length;
    
    return {
      data: {
        totalSessions: sessions.length,
        firstLoginAt,
        lastLoginAt,
        totalDurationSeconds,
        activeSessions,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user session stats:", error);
    return { data: null, error: error.message || "Erreur lors du calcul des statistiques de session." };
  }
}


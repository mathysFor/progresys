// Companies Firestore service - Functions for managing companies and company codes
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config.js';

// ============================================
// CODE GENERATION
// ============================================

/**
 * Générer un code unique (format: XXX-XX-XX comme DTR-XG-YS)
 */
function generateCompanyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Lettres seulement, exclure les caractères ambigus (I, O)
  
  // Générer les 3 parties séparément
  const part1 = Array.from({ length: 3 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part2 = Array.from({ length: 2 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  const part3 = Array.from({ length: 2 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  
  return `${part1}-${part2}-${part3}`; // Format: XXX-XX-XX (ex: DTR-XG-YS)
}

// ============================================
// COMPANY MANAGEMENT
// ============================================

/**
 * Créer une entreprise
 * @param {Object} companyData - Données de l'entreprise
 * @returns {Promise<{data: Object, error: null}|{data: null, error: string}>}
 */
export async function createCompany(companyData) {
  try {
    const companyId = `company-${Date.now()}`;
    const companyRef = doc(db, 'companies', companyId);
    
    await setDoc(companyRef, {
      ...companyData,
      id: companyId,
      credits: companyData.credits || 0,
      usedCredits: 0,
      status: companyData.status || 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { data: { id: companyId, ...companyData }, error: null };
  } catch (error) {
    console.error('Error creating company:', error);
    return { data: null, error: error.message || 'Erreur lors de la création de l\'entreprise.' };
  }
}

/**
 * Obtenir toutes les entreprises
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getAllCompanies() {
  try {
    const companiesRef = collection(db, 'companies');
    const q = query(companiesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const companies = [];
    querySnapshot.forEach((doc) => {
      companies.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: companies, error: null };
  } catch (error) {
    console.error('Error getting all companies:', error);
    return { data: null, error: error.message || 'Erreur lors de la récupération des entreprises.' };
  }
}

/**
 * Obtenir une entreprise par ID
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getCompanyById(companyId) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    
    if (companySnap.exists()) {
      return { data: { id: companySnap.id, ...companySnap.data() }, error: null };
    } else {
      return { data: null, error: 'Entreprise non trouvée.' };
    }
  } catch (error) {
    console.error('Error getting company:', error);
    return { data: null, error: error.message || 'Erreur lors de la récupération de l\'entreprise.' };
  }
}

/**
 * Mettre à jour une entreprise
 * @param {string} companyId - ID de l'entreprise
 * @param {Object} updates - Données à mettre à jour
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function updateCompany(companyId, updates) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await updateDoc(companyRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (error) {
    console.error('Error updating company:', error);
    return { error: error.message || 'Erreur lors de la mise à jour de l\'entreprise.' };
  }
}

/**
 * Supprimer une entreprise
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function deleteCompany(companyId) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    await deleteDoc(companyRef);
    return { error: null };
  } catch (error) {
    console.error('Error deleting company:', error);
    return { error: error.message || 'Erreur lors de la suppression de l\'entreprise.' };
  }
}

/**
 * Ajouter des crédits à une entreprise
 * @param {string} companyId - ID de l'entreprise
 * @param {number} amount - Nombre de crédits à ajouter
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function addCreditsToCompany(companyId, amount) {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    
    if (!companySnap.exists()) {
      return { error: 'Entreprise non trouvée.' };
    }
    
    const companyData = companySnap.data();
    const newCredits = (companyData.credits || 0) + amount;
    
    await updateDoc(companyRef, {
      credits: newCredits,
      updatedAt: serverTimestamp(),
    });
    
    return { error: null };
  } catch (error) {
    console.error('Error adding credits to company:', error);
    return { error: error.message || 'Erreur lors de l\'ajout des crédits.' };
  }
}

// ============================================
// COMPANY CODE MANAGEMENT
// ============================================

/**
 * Générer des codes pour une liste d'emails
 * @param {string} companyId - ID de l'entreprise
 * @param {string} emails - Liste d'emails (séparés par des retours à la ligne)
 * @param {string} createdBy - ID de l'admin qui crée les codes
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function generateCompanyCodes(companyId, emails, createdBy) {
  try {
    const emailList = emails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'));
    
    if (emailList.length === 0) {
      return { data: null, error: 'Aucun email valide fourni' };
    }
    
    // Vérifier que l'entreprise existe
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    
    if (!companySnap.exists()) {
      return { data: null, error: 'Entreprise non trouvée' };
    }
    
    const batch = writeBatch(db);
    const codes = [];
    
    for (const email of emailList) {
      let code;
      let codeId;
      let exists = true;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Générer un code unique
      while (exists && attempts < maxAttempts) {
        code = generateCompanyCode();
        codeId = code.replace(/-/g, ''); // Utiliser le code sans tirets comme ID
        const codeRef = doc(db, 'company-codes', codeId);
        const codeSnap = await getDoc(codeRef);
        exists = codeSnap.exists();
        attempts++;
      }
      
      if (exists) {
        console.error(`Impossible de générer un code unique après ${maxAttempts} tentatives`);
        continue;
      }
      
      const codeRef = doc(db, 'company-codes', codeId);
      batch.set(codeRef, {
        code: code,
        companyId: companyId,
        email: email.toLowerCase().trim(),
        status: 'active',
        usedBy: null,
        usedAt: null,
        formationIds: [],
        createdAt: serverTimestamp(),
        expiresAt: null, // Optionnel: ajouter une date d'expiration
        createdBy: createdBy,
      });
      
      codes.push({ code, email, codeId });
    }
    
    await batch.commit();
    
    return { data: codes, error: null };
  } catch (error) {
    console.error('Error generating company codes:', error);
    return { data: null, error: error.message || 'Erreur lors de la génération des codes.' };
  }
}

/**
 * Obtenir un code par sa valeur
 * @param {string} code - Code à rechercher (format: XXX-XX-XX ou XXXXXXX)
 * @returns {Promise<{data: Object|null, error: null}|{data: null, error: string}>}
 */
export async function getCodeByValue(code) {
  try {
    // Normaliser le code (enlever les tirets, uppercase)
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    const codeRef = doc(db, 'company-codes', normalizedCode);
    const codeSnap = await getDoc(codeRef);
    
    if (codeSnap.exists()) {
      return { data: { id: codeSnap.id, ...codeSnap.data() }, error: null };
    } else {
      return { data: null, error: null };
    }
  } catch (error) {
    console.error('Error getting code by value:', error);
    return { data: null, error: error.message || 'Erreur lors de la récupération du code.' };
  }
}

/**
 * Obtenir tous les codes d'une entreprise
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getCompanyCodes(companyId) {
  try {
    const codesRef = collection(db, 'company-codes');
    const q = query(codesRef, where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const codes = [];
    querySnapshot.forEach((doc) => {
      codes.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return { data: codes, error: null };
  } catch (error) {
    console.error('Error getting company codes:', error);
    return { data: null, error: error.message || 'Erreur lors de la récupération des codes.' };
  }
}

/**
 * Marquer un code comme utilisé
 * @param {string} codeId - ID du code
 * @param {string} userId - ID de l'utilisateur qui utilise le code
 * @param {Array} formationIds - IDs des formations assignées (optionnel)
 * @returns {Promise<{error: null}|{error: string}>}
 */
export async function markCodeAsUsed(codeId, userId, formationIds = []) {
  try {
    const codeRef = doc(db, 'company-codes', codeId);
    const codeSnap = await getDoc(codeRef);
    
    if (!codeSnap.exists()) {
      return { error: 'Code non trouvé' };
    }
    
    const codeData = codeSnap.data();
    
    if (codeData.status !== 'active') {
      return { error: 'Code déjà utilisé ou expiré' };
    }
    
    // Marquer le code comme utilisé
    await updateDoc(codeRef, {
      status: 'used',
      usedBy: userId,
      usedAt: serverTimestamp(),
      formationIds: formationIds,
      updatedAt: serverTimestamp(),
    });
    
    // Décompter le crédit de l'entreprise
    const companyRef = doc(db, 'companies', codeData.companyId);
    const companySnap = await getDoc(companyRef);
    
    if (companySnap.exists()) {
      const companyData = companySnap.data();
      await updateDoc(companyRef, {
        usedCredits: (companyData.usedCredits || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error marking code as used:', error);
    return { error: error.message || 'Erreur lors de la validation du code.' };
  }
}

/**
 * Obtenir les utilisateurs d'une entreprise
 * @param {string} companyId - ID de l'entreprise
 * @returns {Promise<{data: Array, error: null}|{data: null, error: string}>}
 */
export async function getCompanyUsers(companyId) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('companyId', '==', companyId));
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
    console.error('Error getting company users:', error);
    return { data: null, error: error.message || 'Erreur lors de la récupération des utilisateurs.' };
  }
}


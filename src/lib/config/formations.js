// Configuration centralisée des formations
// Utilisé dans la landing page, l'API de paiement, et le formulaire d'inscription

export const formations = [
  {
    id: "pack-dci-dda-lab",
    name: "Pack DCI + DDA + LAB",
    price: 235, // en euros
    priceCents: 23500, // en centimes pour Stripe
    duration: "24 heures",
    description: "Formation complète incluant DCI, DDA et LAB",
    type: "pack",
    popular: true,
  },
  {
    id: "pack-dci-dda",
    name: "Pack DCI + DDA",
    price: 225,
    priceCents: 22500,
    duration: "22h",
    description: "Formation combinant DCI et DDA",
    type: "pack",
    popular: false,
  },
  {
    id: "dci",
    name: "DCI",
    price: 95,
    priceCents: 9500,
    duration: "7h",
    description: "Formation DCI",
    type: "individual",
    popular: false,
  },
  {
    id: "dda",
    name: "DDA",
    price: 120,
    priceCents: 12000,
    duration: "15h",
    description: "Formation DDA",
    type: "individual",
    popular: false,
  },
  {
    id: "lab",
    name: "LAB",
    price: 35,
    priceCents: 3500,
    duration: "2h",
    description: "Formation LAB",
    type: "individual",
    popular: false,
  },
  {
    id: "iobsp-1",
    name: "IOBSP 1",
    price: 495,
    priceCents: 49500,
    duration: "Formation complète",
    description: "Formation IOBSP niveau 1",
    type: "individual",
    popular: false,
  },
  {
    id: "ias-1",
    name: "IAS 1",
    price: 495,
    priceCents: 49500,
    duration: "Formation complète",
    description: "Formation IAS niveau 1",
    type: "individual",
    popular: false,
  },
];

/**
 * Obtenir une formation par son ID
 * @param {string} formationId - ID de la formation
 * @returns {Object|null} Formation ou null si non trouvée
 */
export function getFormationById(formationId) {
  return formations.find(f => f.id === formationId) || null;
}

/**
 * Obtenir toutes les formations d'un type donné
 * @param {string} type - 'pack' ou 'individual'
 * @returns {Array} Liste des formations
 */
export function getFormationsByType(type) {
  return formations.filter(f => f.type === type);
}

/**
 * Obtenir toutes les formations (packs et individuelles)
 * @returns {Object} { packs: Array, individual: Array }
 */
export function getAllFormations() {
  return {
    packs: getFormationsByType("pack"),
    individual: getFormationsByType("individual"),
  };
}

/**
 * Obtenir le prix en centimes pour Stripe
 * @param {string} formationId - ID de la formation
 * @returns {number} Prix en centimes ou 0 si non trouvé
 */
export function getFormationPriceCents(formationId) {
  const formation = getFormationById(formationId);
  return formation ? formation.priceCents : 0;
}

/**
 * Obtenir le prix en euros
 * @param {string} formationId - ID de la formation
 * @returns {number} Prix en euros ou 0 si non trouvé
 */
export function getFormationPrice(formationId) {
  const formation = getFormationById(formationId);
  return formation ? formation.price : 0;
}

/**
 * Décompose un pack en formations individuelles
 * @param {string} packId - ID du pack (ex: "pack-dci-dda-lab")
 * @returns {Array<string>} Array des IDs de formations individuelles
 */
export function expandPackToIndividualFormations(packId) {
  const packMappings = {
    "pack-dci-dda-lab": ["dci", "dda", "lab"],
    "pack-dci-dda": ["dci", "dda"],
  };
  
  return packMappings[packId] || [];
}

/**
 * Décompose un array de formations (packs + individuelles) en formations individuelles uniquement
 * @param {Array<string>} formationIds - Array d'IDs de formations (peut contenir des packs)
 * @returns {Array<string>} Array des IDs de formations individuelles uniquement
 */
export function expandFormationsToIndividual(formationIds) {
  if (!Array.isArray(formationIds)) {
    return [];
  }
  
  const individualFormations = new Set();
  
  formationIds.forEach(formationId => {
    const formation = getFormationById(formationId);
    if (formation && formation.type === "pack") {
      // Si c'est un pack, le décomposer
      const expanded = expandPackToIndividualFormations(formationId);
      expanded.forEach(id => individualFormations.add(id));
    } else if (formation && formation.type === "individual") {
      // Si c'est une formation individuelle, l'ajouter directement
      individualFormations.add(formationId);
    }
  });
  
  return Array.from(individualFormations);
}


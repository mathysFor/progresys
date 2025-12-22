// Progress store using localStorage
const STORAGE_KEYS = {
  SESSION: "elearning_userSession",
  ENTITLEMENTS: "elearning_entitlements",
  PROGRESS: "elearning_progress",
  LAST_COURSES: "elearning_lastCourses",
  REGISTRATION: "elearning_registrationData",
};

/**
 * Get user session from localStorage
 * @returns {Object|null} User session object or null
 */
export function getUserSession() {
  if (typeof window === "undefined") return null;
  
  const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionStr) return null;
  
  try {
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
}

/**
 * Set user session in localStorage
 * @param {Object} session - User session object
 */
export function setUserSession(session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clear user session
 */
export function clearUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  return getUserSession() !== null;
}

/**
 * Get user entitlements (formations souscrites)
 * @returns {string[]} Array of formation IDs
 */
export function getEntitlements() {
  if (typeof window === "undefined") return [];
  
  const entitlementsStr = localStorage.getItem(STORAGE_KEYS.ENTITLEMENTS);
  if (!entitlementsStr) return [];
  
  try {
    return JSON.parse(entitlementsStr);
  } catch {
    return [];
  }
}

/**
 * Set user entitlements
 * @param {string[]} entitlements - Array of formation IDs
 */
export function setEntitlements(entitlements) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.ENTITLEMENTS, JSON.stringify(entitlements));
}

/**
 * Get all progress data
 * @returns {Object} progressByCourseId object
 */
export function getProgress() {
  if (typeof window === "undefined") return {};
  
  const progressStr = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (!progressStr) return {};
  
  try {
    return JSON.parse(progressStr);
  } catch {
    return {};
  }
}

/**
 * Get progress for a specific course
 * @param {string} courseId - Course ID
 * @returns {Object|null} Progress object or null
 */
export function getCourseProgress(courseId) {
  const progress = getProgress();
  return progress[courseId] || null;
}

/**
 * Update progress for a course
 * @param {string} courseId - Course ID
 * @param {Object} progressData - Progress data object
 * @param {number} progressData.timeSpentSeconds - Time spent in seconds
 * @param {number} progressData.percentComplete - Completion percentage (0-100)
 * @param {number} [progressData.lastVideoPositionSeconds] - Last video position
 */
export function updateCourseProgress(courseId, progressData) {
  if (typeof window === "undefined") return;
  
  const progress = getProgress();
  const existing = progress[courseId] || {};
  
  progress[courseId] = {
    ...existing,
    ...progressData,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
}

/**
 * Get last accessed course for a formation
 * @param {string} formationId - Formation ID
 * @returns {string|null} Course ID or null
 */
export function getLastCourse(formationId) {
  if (typeof window === "undefined") return null;
  
  const lastCoursesStr = localStorage.getItem(STORAGE_KEYS.LAST_COURSES);
  if (!lastCoursesStr) return null;
  
  try {
    const lastCourses = JSON.parse(lastCoursesStr);
    return lastCourses[formationId] || null;
  } catch {
    return null;
  }
}

/**
 * Set last accessed course for a formation
 * @param {string} formationId - Formation ID
 * @param {string} courseId - Course ID
 */
export function setLastCourse(formationId, courseId) {
  if (typeof window === "undefined") return;
  
  const lastCoursesStr = localStorage.getItem(STORAGE_KEYS.LAST_COURSES);
  let lastCourses = {};
  
  if (lastCoursesStr) {
    try {
      lastCourses = JSON.parse(lastCoursesStr);
    } catch {
      lastCourses = {};
    }
  }
  
  lastCourses[formationId] = courseId;
  localStorage.setItem(STORAGE_KEYS.LAST_COURSES, JSON.stringify(lastCourses));
}

/**
 * Initialize default session (for login simulation)
 */
export function initDefaultSession() {
  const session = {
    id: "user-1",
    email: "user@example.com",
    name: "Utilisateur Test",
    createdAt: new Date().toISOString(),
  };
  
  setUserSession(session);
  
  // MVP: All formations accessible
  setEntitlements(["iobsp", "dda"]);
}

/**
 * Save registration data
 * @param {Object} formData - Registration form data
 * @param {string} formData.lastName
 * @param {string} formData.firstName
 * @param {string} formData.phone
 * @param {string} formData.birthDate
 * @param {string} formData.birthPlace
 * @param {string} formData.address
 * @param {string} formData.email
 * @param {boolean} formData.paidByCompany
 */
export function saveRegistrationData(formData) {
  if (typeof window === "undefined") return;
  
  const registrationData = {
    ...formData,
    submittedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.REGISTRATION, JSON.stringify(registrationData));
}

/**
 * Get registration data
 * @returns {Object|null} Registration data or null
 */
export function getRegistrationData() {
  if (typeof window === "undefined") return null;
  
  const registrationStr = localStorage.getItem(STORAGE_KEYS.REGISTRATION);
  if (!registrationStr) return null;
  
  try {
    return JSON.parse(registrationStr);
  } catch {
    return null;
  }
}


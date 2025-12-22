import { getFormationById } from "../mock/formations.js";
import { getCoursesForChapter } from "./courses.js";

/**
 * Get all courses from a formation (internal helper)
 * Similar to courses.js but exported here for use
 */
function getAllCourses(formationId) {
  const formation = getFormationById(formationId);
  if (!formation) return [];
  
  const courses = [];
  
  for (const module of formation.modules || []) {
    for (const chapter of module.chapters || []) {
      const chapterCourses = getCoursesForChapter(chapter);
      for (const course of chapterCourses) {
        courses.push({
          ...course,
          formationId: formation.id,
          moduleId: module.id,
          chapterId: chapter.id,
          isTC: module.name.toLowerCase().includes("tronc commun"),
        });
      }
    }
  }
  
  return courses;
}

/**
 * Calculate global progress for a formation
 * @param {string} formationId - Formation ID
 * @param {Object} userProgress - Progress data from Firestore (progressByCourseId object). Required.
 * @returns {Object} { percentComplete, timeSpentSeconds, totalDurationSeconds }
 */
export function getFormationProgress(formationId, userProgress = {}) {
  const progress = userProgress || {};
  const allCourses = getAllCourses(formationId);
  
  if (allCourses.length === 0) {
    return {
      percentComplete: 0,
      timeSpentSeconds: 0,
      totalDurationSeconds: 0,
    };
  }
  
  let totalDuration = 0;
  let totalTimeSpent = 0;
  let totalPercent = 0;
  
  for (const course of allCourses) {
    const courseProgress = progress[course.id] || {};
    const duration = course.durationSeconds || 0;
    const timeSpent = courseProgress.timeSpentSeconds || 0;
    const percent = courseProgress.percentComplete || 0;
    
    totalDuration += duration;
    totalTimeSpent += timeSpent;
    totalPercent += percent;
  }
  
  // Calculate average percent (weighted by duration)
  const percentComplete = totalDuration > 0
    ? Math.min(100, (totalTimeSpent / totalDuration) * 100)
    : allCourses.length > 0
    ? Math.min(100, totalPercent / allCourses.length)
    : 0;
  
  return {
    percentComplete: Math.round(percentComplete * 10) / 10,
    timeSpentSeconds: totalTimeSpent,
    totalDurationSeconds: totalDuration,
  };
}

/**
 * Check if a module is Tronc Commun
 * @param {Object} module - Module object
 * @returns {boolean}
 */
function isTCModule(module) {
  return module.name.toLowerCase().includes("tronc commun");
}

/**
 * Calculate Tronc Commun progress for a formation
 * @param {string} formationId - Formation ID
 * @param {Object} userProgress - Progress data from Firestore (progressByCourseId object). Required.
 * @returns {Object|null} { percentComplete, timeSpentSeconds, totalDurationSeconds } or null if no TC
 */
export function getTCProgress(formationId, userProgress = {}) {
  const formation = getFormationById(formationId);
  if (!formation) return null;
  
  const progress = userProgress || {};
  
  // Find TC module
  const tcModule = formation.modules.find((m) => isTCModule(m));
  if (!tcModule) return null;
  
  // Get all courses from TC module
  const tcCourses = [];
  for (const chapter of tcModule.chapters || []) {
    const chapterCourses = getCoursesForChapter(chapter);
    for (const course of chapterCourses) {
      tcCourses.push({
        ...course,
        moduleId: tcModule.id,
      });
    }
  }
  
  if (tcCourses.length === 0) {
    return {
      percentComplete: 0,
      timeSpentSeconds: 0,
      totalDurationSeconds: 0,
    };
  }
  
  let totalDuration = 0;
  let totalTimeSpent = 0;
  
  for (const course of tcCourses) {
    const courseProgress = progress[course.id] || {};
    const duration = course.durationSeconds || 0;
    const timeSpent = courseProgress.timeSpentSeconds || 0;
    
    totalDuration += duration;
    totalTimeSpent += timeSpent;
  }
  
  const percentComplete = totalDuration > 0
    ? Math.min(100, (totalTimeSpent / totalDuration) * 100)
    : 0;
  
  return {
    percentComplete: Math.round(percentComplete * 10) / 10,
    timeSpentSeconds: totalTimeSpent,
    totalDurationSeconds: totalDuration,
  };
}

/**
 * Check if a course belongs to Tronc Commun
 * @param {Object} course - Course object with moduleId
 * @param {string} formationId - Formation ID
 * @returns {boolean}
 */
export function isTCCourse(course, formationId) {
  if (!course || !course.moduleId) return false;
  
  const formation = getFormationById(formationId);
  if (!formation) return false;
  
  const module = formation.modules.find((m) => m.id === course.moduleId);
  return module ? isTCModule(module) : false;
}

/**
 * Get all courses from a specific module
 * @param {string} formationId - Formation ID
 * @param {string} moduleId - Module ID
 * @returns {Array} Array of course objects
 */
function getModuleCourses(formationId, moduleId) {
  const formation = getFormationById(formationId);
  if (!formation) return [];
  
  const module = formation.modules.find((m) => m.id === moduleId);
  if (!module) return [];
  
  const courses = [];
  for (const chapter of module.chapters || []) {
    const chapterCourses = getCoursesForChapter(chapter);
    for (const course of chapterCourses) {
      courses.push({
        ...course,
        formationId: formation.id,
        moduleId: module.id,
        chapterId: chapter.id,
      });
    }
  }
  
  return courses;
}

/**
 * Calculate progress for a specific module
 * @param {string} formationId - Formation ID
 * @param {string} moduleId - Module ID
 * @param {Object} userProgress - Progress data from Firestore (progressByCourseId object)
 * @returns {Object} { percentComplete, timeSpentSeconds, totalDurationSeconds }
 */
export function getModuleProgress(formationId, moduleId, userProgress = {}) {
  const progress = userProgress || {};
  const moduleCourses = getModuleCourses(formationId, moduleId);
  
  if (moduleCourses.length === 0) {
    return {
      percentComplete: 0,
      timeSpentSeconds: 0,
      totalDurationSeconds: 0,
    };
  }
  
  let totalDuration = 0;
  let totalTimeSpent = 0;
  
  for (const course of moduleCourses) {
    const courseProgress = progress[course.id] || {};
    const duration = course.durationSeconds || 0;
    const timeSpent = courseProgress.timeSpentSeconds || 0;
    
    totalDuration += duration;
    totalTimeSpent += timeSpent;
  }
  
  const percentComplete = totalDuration > 0
    ? Math.min(100, (totalTimeSpent / totalDuration) * 100)
    : 0;
  
  return {
    percentComplete: Math.round(percentComplete * 10) / 10,
    timeSpentSeconds: totalTimeSpent,
    totalDurationSeconds: totalDuration,
  };
}

/**
 * Check if a module's quiz is unlocked based on time spent
 * @param {string} formationId - Formation ID
 * @param {string} moduleId - Module ID
 * @param {Object} userProgress - Progress data from Firestore (progressByCourseId object)
 * @returns {boolean} True if quiz is unlocked
 */
export function isModuleQuizUnlocked(formationId, moduleId, userProgress = {}) {
  const formation = getFormationById(formationId);
  if (!formation) return false;
  
  const module = formation.modules.find((m) => m.id === moduleId);
  if (!module) return false;
  
  const moduleProgress = getModuleProgress(formationId, moduleId, userProgress);
  
  // If module has requiredHoursSeconds, use it
  // Otherwise, default to 80% of total duration
  const requiredTime = module.requiredHoursSeconds !== undefined
    ? module.requiredHoursSeconds
    : Math.floor(moduleProgress.totalDurationSeconds * 0.8);
  
  return moduleProgress.timeSpentSeconds >= requiredTime;
}


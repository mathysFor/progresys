import { formations, getFormationById } from "../mock/formations.js";
import { getCourseProgress, getLastCourse } from "../progress/store.js";

/**
 * Get all courses for a chapter
 * Handles both variants: with subChapters (longue) and without (courte)
 * @param {Object} chapter - Chapter object
 * @returns {Array} Array of course objects
 */
export function getCoursesForChapter(chapter) {
  if (!chapter) return [];
  
  // If chapter has subChapters, flatten all courses from subChapters
  if (chapter.subChapters && chapter.subChapters.length > 0) {
    return chapter.subChapters.flatMap((subChapter) => 
      subChapter.courses || []
    );
  }
  
  // Otherwise, return courses directly from chapter
  return chapter.courses || [];
}

/**
 * Get course by ID from all formations
 * @param {string} courseId - Course ID
 * @returns {Object|null} Course object with parent context, or null
 */
export function getCourseById(courseId) {
  for (const formation of formations) {
    for (const module of formation.modules || []) {
      for (const chapter of module.chapters || []) {
        // Check courses in subChapters (longue formation)
        if (chapter.subChapters) {
          for (const subChapter of chapter.subChapters) {
            const course = subChapter.courses?.find((c) => c.id === courseId);
            if (course) {
              return {
                ...course,
                formationId: formation.id,
                moduleId: module.id,
                chapterId: chapter.id,
                subChapterId: subChapter.id,
              };
            }
          }
        }
        
        // Check courses directly in chapter (courte formation)
        const course = chapter.courses?.find((c) => c.id === courseId);
        if (course) {
          return {
            ...course,
            formationId: formation.id,
            moduleId: module.id,
            chapterId: chapter.id,
            subChapterId: null,
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all courses from a formation in flat array
 * @param {string} formationId - Formation ID
 * @returns {Array} Array of course objects with parent context
 */
export function getAllCoursesFromFormation(formationId) {
  const formation = getFormationById(formationId);
  if (!formation) return [];
  
  const courses = [];
  
  for (const module of formation.modules || []) {
    for (const chapter of module.chapters || []) {
      if (chapter.subChapters && chapter.subChapters.length > 0) {
        // Longue formation: iterate through subChapters
        for (const subChapter of chapter.subChapters) {
          for (const course of subChapter.courses || []) {
            courses.push({
              ...course,
              formationId: formation.id,
              moduleId: module.id,
              chapterId: chapter.id,
              subChapterId: subChapter.id,
            });
          }
        }
      } else {
        // Courte formation: courses directly in chapter
        for (const course of chapter.courses || []) {
          courses.push({
            ...course,
            formationId: formation.id,
            moduleId: module.id,
            chapterId: chapter.id,
            subChapterId: null,
          });
        }
      }
    }
  }
  
  return courses;
}

/**
 * Get next and previous course for navigation
 * @param {string} courseId - Current course ID
 * @param {string} formationId - Formation ID
 * @returns {Object} { next: course object or null, prev: course object or null }
 */
export function getNextPrevCourse(courseId, formationId) {
  const allCourses = getAllCoursesFromFormation(formationId);
  const currentIndex = allCourses.findIndex((c) => c.id === courseId);
  
  if (currentIndex === -1) {
    return { next: null, prev: null };
  }
  
  return {
    next: currentIndex < allCourses.length - 1 ? allCourses[currentIndex + 1] : null,
    prev: currentIndex > 0 ? allCourses[currentIndex - 1] : null,
  };
}

/**
 * Get course to resume for a formation
 * Priority: 1) Last accessed course, 2) First incomplete course, 3) First course
 * @param {string} formationId - Formation ID
 * @param {Object} userProgress - Progress data from store
 * @returns {Object|null} Course object to resume or null
 */
export function getResumeCourse(formationId, userProgress = {}) {
  const allCourses = getAllCoursesFromFormation(formationId);
  if (allCourses.length === 0) return null;
  
  // 1. Check last accessed course
  const lastCourseId = getLastCourse(formationId);
  if (lastCourseId) {
    const lastCourse = allCourses.find((c) => c.id === lastCourseId);
    if (lastCourse) {
      return lastCourse;
    }
  }
  
  // 2. Find first incomplete course
  for (const course of allCourses) {
    const progress = userProgress[course.id] || getCourseProgress(course.id);
    const percentComplete = progress?.percentComplete || 0;
    
    if (percentComplete < 100) {
      return course;
    }
  }
  
  // 3. Return first course
  return allCourses[0];
}

/**
 * Check if a course has downloadable PDF content
 * @param {Object} course - Course object
 * @returns {boolean}
 */
export function hasPdfContent(course) {
  if (!course || !course.contents) return false;
  return course.contents.some((content) => content.type === "pdf");
}

/**
 * Get PDF content from a course
 * @param {Object} course - Course object
 * @returns {Object|null} PDF content object or null
 */
export function getPdfContent(course) {
  if (!course || !course.contents) return null;
  return course.contents.find((content) => content.type === "pdf") || null;
}


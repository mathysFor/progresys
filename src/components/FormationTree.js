"use client";

import { useRouter } from "next/navigation";
import { getCoursesForChapter, getCourseById } from "../lib/selectors/courses.js";
import { getProgress, getCourseProgress } from "../lib/progress/store.js";
import { formatTimeReadable } from "../lib/utils/time.js";
import ProgressBar from "./ProgressBar.js";

export default function FormationTree({ 
  formation, 
  userProgress = null,
  className = "",
  ...props 
}) {
  const router = useRouter();
  const progress = userProgress || getProgress();

  if (!formation) return null;

  const handleCourseClick = (courseId) => {
    router.push(`/module/${courseId}`);
  };

  // Calculate progress for a chapter
  const getChapterProgress = (chapter) => {
    const courses = getCoursesForChapter(chapter);
    if (courses.length === 0) {
      return { percentComplete: 0, timeSpentSeconds: 0, totalDurationSeconds: 0 };
    }

    let totalDuration = 0;
    let totalTimeSpent = 0;

    courses.forEach((course) => {
      const courseProgress = progress[course.id] || {};
      const duration = course.durationSeconds || 0;
      const timeSpent = courseProgress.timeSpentSeconds || 0;

      totalDuration += duration;
      totalTimeSpent += timeSpent;
    });

    const percentComplete = totalDuration > 0
      ? Math.min(100, (totalTimeSpent / totalDuration) * 100)
      : 0;

    return {
      percentComplete,
      timeSpentSeconds: totalTimeSpent,
      totalDurationSeconds: totalDuration,
    };
  };

  // Calculate progress for a module
  const getModuleProgress = (module) => {
    let totalDuration = 0;
    let totalTimeSpent = 0;

    module.chapters.forEach((chapter) => {
      const chapterProgress = getChapterProgress(chapter);
      totalDuration += chapterProgress.totalDurationSeconds;
      totalTimeSpent += chapterProgress.timeSpentSeconds;
    });

    const percentComplete = totalDuration > 0
      ? Math.min(100, (totalTimeSpent / totalDuration) * 100)
      : 0;

    return {
      percentComplete,
      timeSpentSeconds: totalTimeSpent,
      totalDurationSeconds: totalDuration,
    };
  };

  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {formation.modules.map((module) => {
        const moduleProgress = getModuleProgress(module);

        return (
          <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Module Header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {module.name}
                </h3>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(moduleProgress.percentComplete)}%
                </span>
              </div>
              <ProgressBar percent={moduleProgress.percentComplete} className="mb-2" />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {formatTimeReadable(moduleProgress.timeSpentSeconds)} /{" "}
                  {formatTimeReadable(moduleProgress.totalDurationSeconds)}
                </span>
              </div>
            </div>

            {/* Chapters */}
            <div className="p-4 space-y-4">
              {module.chapters.map((chapter) => {
                const chapterProgress = getChapterProgress(chapter);
                const courses = getCoursesForChapter(chapter);

                return (
                  <div key={chapter.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Chapter Header */}
                    <div className="bg-gray-100 p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {chapter.name}
                        </h4>
                        <span className="text-xs font-medium text-gray-700">
                          {Math.round(chapterProgress.percentComplete)}%
                        </span>
                      </div>
                      <ProgressBar 
                        percent={chapterProgress.percentComplete} 
                        className="mb-1"
                      />
                      <div className="text-xs text-gray-600">
                        {formatTimeReadable(chapterProgress.timeSpentSeconds)} /{" "}
                        {formatTimeReadable(chapterProgress.totalDurationSeconds)}
                      </div>
                    </div>

                    {/* Sub-chapters (if present) or Courses */}
                    <div className="p-3 space-y-3">
                      {chapter.subChapters && chapter.subChapters.length > 0 ? (
                        // Longue formation: show sub-chapters
                        chapter.subChapters.map((subChapter) => {
                          let subChapterDuration = 0;
                          let subChapterTimeSpent = 0;

                          subChapter.courses.forEach((course) => {
                            const courseProgress = progress[course.id] || {};
                            subChapterDuration += course.durationSeconds || 0;
                            subChapterTimeSpent += courseProgress.timeSpentSeconds || 0;
                          });

                          const subChapterPercent = subChapterDuration > 0
                            ? Math.min(100, (subChapterTimeSpent / subChapterDuration) * 100)
                            : 0;

                          return (
                            <div key={subChapter.id} className="border border-gray-200 rounded p-3 bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-gray-800">
                                  {subChapter.name}
                                </h5>
                                <span className="text-xs font-medium text-gray-600">
                                  {Math.round(subChapterPercent)}%
                                </span>
                              </div>
                              <ProgressBar percent={subChapterPercent} className="mb-2" />
                              
                              {/* Courses in sub-chapter */}
                              <div className="space-y-1 ml-4">
                                {subChapter.courses.map((course) => {
                                  const courseProgress = progress[course.id] || {};
                                  const percent = courseProgress.percentComplete || 0;

                                  return (
                                    <div
                                      key={course.id}
                                      onClick={() => handleCourseClick(course.id)}
                                      className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                      <span className="text-sm text-gray-700">
                                        {course.name}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {Math.round(percent)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Courte formation: show courses directly
                        courses.map((course) => {
                          const courseProgress = progress[course.id] || {};
                          const percent = courseProgress.percentComplete || 0;

                          return (
                            <div
                              key={course.id}
                              onClick={() => handleCourseClick(course.id)}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                            >
                              <span className="text-sm text-gray-700">
                                {course.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {Math.round(percent)}%
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { isLoggedIn, getCourseProgress, updateCourseProgress, setLastCourse } from "../../../lib/progress/store.js";
import { getCourseById, getNextPrevCourse } from "../../../lib/selectors/courses.js";
import { getTCProgress, isTCCourse } from "../../../lib/selectors/formations.js";
import { getFormationById } from "../../../lib/mock/formations.js";
import VideoPlayer from "../../../components/VideoPlayer.js";
import Button from "../../../components/Button.js";
import TCCounter from "../../../components/TCCounter.js";

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId;
  
  const [course, setCourse] = useState(null);
  const [formation, setFormation] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tcProgress, setTcProgress] = useState(null);
  const [navigation, setNavigation] = useState({ next: null, prev: null });
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const courseData = getCourseById(courseId);
    if (!courseData) {
      router.push("/dashboard");
      return;
    }

    setCourse(courseData);
    setFormation(getFormationById(courseData.formationId));

    // Load progress
    const courseProgress = getCourseProgress(courseId);
    setProgress(courseProgress || {
      timeSpentSeconds: 0,
      percentComplete: 0,
      lastVideoPositionSeconds: 0,
    });

    // Load navigation
    const nav = getNextPrevCourse(courseId, courseData.formationId);
    setNavigation(nav);

    // Load TC progress if this course is in TC
    if (isTCCourse(courseData, courseData.formationId)) {
      const tc = getTCProgress(courseData.formationId);
      setTcProgress(tc);
    }

    // Set last course accessed
    setLastCourse(courseData.formationId, courseId);
  }, [courseId, router]);

  // Auto-save progress
  const handleProgressUpdate = useCallback((timeSpent) => {
    if (!course) return;

    const duration = course.durationSeconds || 3600;
    const percentComplete = Math.min(100, (timeSpent / duration) * 100);

    const newProgress = {
      timeSpentSeconds: timeSpent,
      percentComplete: percentComplete,
      lastVideoPositionSeconds: timeSpent,
    };

    setProgress(newProgress);
    updateCourseProgress(courseId, newProgress);
    setLastSaved(new Date());
  }, [course, courseId]);

  // Save video position when component unmounts or changes
  useEffect(() => {
    return () => {
      if (course && progress) {
        updateCourseProgress(courseId, progress);
      }
    };
  }, [course, courseId, progress]);

  if (!course || !formation) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  // Get video content
  const videoContent = course.contents?.find((c) => c.type === "video");
  const videoUrl = videoContent?.url || "";
  const videoTitle = videoContent?.title || course.name;

  // Build breadcrumb path
  const getBreadcrumbPath = () => {
    const path = [formation.name];
    
    if (course.moduleId) {
      const module = formation.modules?.find((m) => m.id === course.moduleId);
      if (module) path.push(module.name);
    }
    
    if (course.chapterId) {
      const module = formation.modules?.find((m) => m.id === course.moduleId);
      const chapter = module?.chapters?.find((c) => c.id === course.chapterId);
      if (chapter) path.push(chapter.name);
    }
    
    if (course.subChapterId) {
      const module = formation.modules?.find((m) => m.id === course.moduleId);
      const chapter = module?.chapters?.find((c) => c.id === course.chapterId);
      const subChapter = chapter?.subChapters?.find((sc) => sc.id === course.subChapterId);
      if (subChapter) path.push(subChapter.name);
    }
    
    path.push(course.name);
    return path;
  };

  const breadcrumbPath = getBreadcrumbPath();

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="secondary"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-0 mb-4"
            >
              ← Retour au dashboard
            </Button>
            <nav className="text-sm text-white text-opacity-90" aria-label="Breadcrumb">
              {breadcrumbPath.map((item, index) => (
                <span key={index}>
                  {index > 0 && <span className="mx-2">/</span>}
                  <span className={index === breadcrumbPath.length - 1 ? "font-semibold" : ""}>
                    {item}
                  </span>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <VideoPlayer
              videoUrl={videoUrl}
              title={videoTitle}
              initialPosition={progress?.lastVideoPositionSeconds || 0}
              durationSeconds={course.durationSeconds || 3600}
              onProgressUpdate={handleProgressUpdate}
              className="mb-6"
            />

            {/* Course Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {course.name}
              </h2>
              
              {/* Progress Info */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progression
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {Math.round(progress?.percentComplete || 0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="gradient-primary h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, progress?.percentComplete || 0)}%` }}
                  />
                </div>
              </div>

              {/* Other Contents */}
              {course.contents && course.contents.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Ressources
                  </h3>
                  <div className="space-y-2">
                    {course.contents.map((content) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {content.title}
                          </p>
                          <p className="text-xs text-gray-600 capitalize">
                            {content.type}
                          </p>
                        </div>
                        {content.type === "pdf" && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#3B82F6] hover:underline"
                          >
                            Télécharger
                          </a>
                        )}
                        {content.type === "canva" && (
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#3B82F6] hover:underline"
                          >
                            Ouvrir
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* TC Counter */}
            {tcProgress && (
              <TCCounter tcProgress={tcProgress} />
            )}

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Navigation
              </h3>
              <div className="space-y-3">
                {navigation.prev ? (
                  <Button
                    onClick={() => router.push(`/module/${navigation.prev.id}`)}
                    variant="outline"
                    className="w-full"
                  >
                    ← Précédent
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    ← Précédent
                  </Button>
                )}
                {navigation.next ? (
                  <Button
                    onClick={() => router.push(`/module/${navigation.next.id}`)}
                    variant="gradient"
                    className="w-full"
                  >
                    Suivant →
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" disabled>
                    Suivant →
                  </Button>
                )}
              </div>
            </div>

            {/* Save Status */}
            {lastSaved && (
              <div className="text-xs text-gray-500 text-center">
                Dernière sauvegarde : {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


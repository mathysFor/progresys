"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { isLoggedIn, getCourseProgress, updateCourseProgress, setLastCourse, getProgress } from "../../../lib/progress/store-firebase.js";
import { getCourseById, getNextPrevCourse } from "../../../lib/selectors/courses.js";
import { getTCProgress, isTCCourse, getFormationProgress } from "../../../lib/selectors/formations.js";
import { getFormationById } from "../../../lib/mock/formations.js";
import { formatTime } from "../../../lib/utils/time.js";
import { signOut } from "../../../lib/firebase/auth.js";
import { useInactivityDetector } from "../../../lib/hooks/useInactivityDetector.js";
import VideoPlayer from "../../../components/VideoPlayer.js";
import Button from "../../../components/Button.js";
import TCCounter from "../../../components/TCCounter.js";
import InactivityWarning from "../../../components/InactivityWarning.js";

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
  const [userProgress, setUserProgress] = useState({});
  const [formationTimeSpent, setFormationTimeSpent] = useState(0);
  const timerIntervalRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(null);
  const wasPausedRef = useRef(false);

  // Inactivity detection: 15 minutes = 900000ms, warning at 14min30 = 30000ms before
  const { isActive, timeUntilLogout, resetTimer } = useInactivityDetector(900000, 30000);

  // Handle logout when timeUntilLogout reaches 0
  useEffect(() => {
    if (timeUntilLogout === 0) {
      const handleLogout = async () => {
        // Save current progress before logout
        if (course && startTimeRef.current) {
          const now = wasPausedRef.current && pausedTimeRef.current 
            ? pausedTimeRef.current 
            : Date.now();
          const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
          const duration = course.durationSeconds || 3600;
          const percentComplete = Math.min(100, (elapsedSeconds / duration) * 100);

          const finalProgress = {
            timeSpentSeconds: elapsedSeconds,
            percentComplete: percentComplete,
            lastVideoPositionSeconds: progress?.lastVideoPositionSeconds || elapsedSeconds,
          };

          await updateCourseProgress(courseId, finalProgress);
        }

        // Sign out and redirect
        await signOut();
        router.push("/login");
      };

      handleLogout();
    }
  }, [timeUntilLogout, course, courseId, progress, router]);

  useEffect(() => {
    const loadData = async () => {
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

      // Load all progress
      const progressResult = await getProgress();
      const allProgress = progressResult.data || {};
      setUserProgress(allProgress);

      // Load course progress
      const courseProgressResult = await getCourseProgress(courseId);
      setProgress(courseProgressResult.data || {
        timeSpentSeconds: 0,
        percentComplete: 0,
        lastVideoPositionSeconds: 0,
      });

      // Load navigation
      const nav = getNextPrevCourse(courseId, courseData.formationId);
      setNavigation(nav);

      // Load TC progress if this course is in TC
      if (isTCCourse(courseData, courseData.formationId)) {
        const tc = getTCProgress(courseData.formationId, allProgress);
        setTcProgress(tc);
      }

      // Calculate formation time spent
      const formationProgress = getFormationProgress(courseData.formationId, allProgress);
      setFormationTimeSpent(formationProgress.timeSpentSeconds || 0);

      // Set last course accessed
      await setLastCourse(courseData.formationId, courseId);
    };

    loadData();
  }, [courseId, router]);

  // Auto-increment time counter while on page (only when active)
  useEffect(() => {
    if (!course || !progress) return;

    // Clean up any existing intervals
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    // Initialize start time on first load
    if (!startTimeRef.current) {
      const initialTimeSpent = progress.timeSpentSeconds || 0;
      startTimeRef.current = Date.now() - (initialTimeSpent * 1000);
    }

    // If user becomes inactive, pause the timer
    if (!isActive) {
      // Save the current time when pausing
      if (!wasPausedRef.current) {
        pausedTimeRef.current = Date.now();
        wasPausedRef.current = true;
      }
      return; // Don't start intervals when inactive
    }

    // User is active - resume or start the timer
    if (wasPausedRef.current && pausedTimeRef.current) {
      // Adjust start time to account for the pause duration
      const pauseDuration = pausedTimeRef.current - (startTimeRef.current + ((progress.timeSpentSeconds || 0) * 1000));
      startTimeRef.current = startTimeRef.current + pauseDuration;
      pausedTimeRef.current = null;
      wasPausedRef.current = false;
    }

    // Start timer that increments every second
    timerIntervalRef.current = setInterval(() => {
      if (!isActive) return; // Double check, should not happen but safety

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);

      // Update course progress
      const duration = course.durationSeconds || 3600;
      const percentComplete = Math.min(100, (elapsedSeconds / duration) * 100);

      const newProgress = {
        timeSpentSeconds: elapsedSeconds,
        percentComplete: percentComplete,
        lastVideoPositionSeconds: progress.lastVideoPositionSeconds || elapsedSeconds,
      };

      setProgress(newProgress);

      // Update userProgress and recalculate formation time
      setUserProgress((prev) => {
        const updated = {
          ...prev,
          [courseId]: newProgress,
        };

        // Calculate formation time immediately
        const formationProgress = getFormationProgress(course.formationId, updated);
        setFormationTimeSpent(formationProgress.timeSpentSeconds || 0);

        // Update TC progress if applicable
        if (isTCCourse(course, course.formationId)) {
          const tc = getTCProgress(course.formationId, updated);
          setTcProgress(tc);
        }

        return updated;
      });
    }, 1000); // Update every second

    // Save to Firestore every 30 seconds (only when active)
    saveIntervalRef.current = setInterval(async () => {
      if (course && startTimeRef.current && isActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const duration = course.durationSeconds || 3600;
        const percentComplete = Math.min(100, (elapsedSeconds / duration) * 100);

        const progressToSave = {
          timeSpentSeconds: elapsedSeconds,
          percentComplete: percentComplete,
          lastVideoPositionSeconds: progress.lastVideoPositionSeconds || elapsedSeconds,
        };

        await updateCourseProgress(courseId, progressToSave);
        setLastSaved(new Date());
      }
    }, 30000); // Save every 30 seconds

    // Cleanup
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      
      // Final save on unmount (only if active)
      if (course && startTimeRef.current && isActive) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const duration = course.durationSeconds || 3600;
        const percentComplete = Math.min(100, (elapsedSeconds / duration) * 100);

        const finalProgress = {
          timeSpentSeconds: elapsedSeconds,
          percentComplete: percentComplete,
          lastVideoPositionSeconds: progress?.lastVideoPositionSeconds || elapsedSeconds,
        };

        updateCourseProgress(courseId, finalProgress);
      }
    };
  }, [course, courseId, progress?.lastVideoPositionSeconds, isActive]);

  // Auto-save progress (for VideoPlayer if needed)
  const handleProgressUpdate = useCallback(async (timeSpent) => {
    if (!course) return;

    const duration = course.durationSeconds || 3600;
    const percentComplete = Math.min(100, (timeSpent / duration) * 100);

    const newProgress = {
      timeSpentSeconds: timeSpent,
      percentComplete: percentComplete,
      lastVideoPositionSeconds: timeSpent,
    };

    // Update the start time reference to sync with video position
    if (startTimeRef.current) {
      startTimeRef.current = Date.now() - (timeSpent * 1000);
    }

    setProgress(newProgress);
    
    // Update userProgress with new course progress to calculate formation time
    setUserProgress((prev) => {
      const updated = {
        ...prev,
        [courseId]: newProgress,
      };
      
      // Calculate formation time immediately with updated progress
      const formationProgress = getFormationProgress(course.formationId, updated);
      setFormationTimeSpent(formationProgress.timeSpentSeconds || 0);
      
      // Update TC progress if applicable
      if (isTCCourse(course, course.formationId)) {
        const tc = getTCProgress(course.formationId, updated);
        setTcProgress(tc);
      }
      
      return updated;
    });
    
    await updateCourseProgress(courseId, newProgress);
    setLastSaved(new Date());
  }, [course, courseId]);


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
      {/* Inactivity Warning Modal */}
      {timeUntilLogout !== null && timeUntilLogout > 0 && (
        <InactivityWarning 
          timeUntilLogout={timeUntilLogout} 
          onStayActive={resetTimer}
        />
      )}

      {/* Header */}
      <header className="gradient-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Button
              onClick={() => router.push("/dashboard")}
              variant="secondary"
              className="bg-white bg-opacity-20 cursor-pointer hover:bg-opacity-30 text-white border-0 mb-4"
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
            {/* Formation Time Counter */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 flex-1">
                  Temps de formation
                </h3>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(formationTimeSpent)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Temps total passé sur cette formation
              </p>
            </div>

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


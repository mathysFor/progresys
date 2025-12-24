"use client";

import { useState, useEffect, useRef } from "react";

export default function VideoPlayer({ 
  videoUrl, 
  title = "Video",
  initialPosition = 0,
  onTimeUpdate = null,
  onProgressUpdate = null,
  durationSeconds = 0,
  className = "",
  ...props 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [videoDuration, setVideoDuration] = useState(durationSeconds || 0);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Mock video duration if not provided
    if (!durationSeconds && videoRef.current) {
      // For mock, we'll use a default duration or try to get it from video element
      // In real implementation, this would come from the video metadata
      setVideoDuration(3600); // Default 1 hour for mock
    } else {
      setVideoDuration(durationSeconds);
    }
  }, [durationSeconds]);

  useEffect(() => {
    // Set initial position
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
      setCurrentTime(initialPosition);
    }
  }, [initialPosition]);

  useEffect(() => {
    if (isPlaying) {
      // Mock playback: increment current time
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= videoDuration) {
            setIsPlaying(false);
            return videoDuration;
          }
          
          // Call progress update callback every 5 seconds
          if (onProgressUpdate && newTime % 5 === 0) {
            onProgressUpdate(newTime);
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, videoDuration, onProgressUpdate]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Video Placeholder */}
      <div className="relative w-full bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        {!isPlaying ? (
          <button
            onClick={togglePlay}
            className="cursor-pointer absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors z-10"
            aria-label="Play video"
          >
            <div className="w-20 h-20 rounded-full bg-white bg-opacity-90 flex items-center justify-center hover:bg-opacity-100 transition-opacity">
              <svg
                className="w-10 h-10 text-gray-900 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-lg">Lecture en cours...</div>
          </div>
        )}
        
        {/* Video element (hidden for mock, but structure ready for real video) */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          style={{ display: "none" }}
        />
      </div>

      {/* Video Info */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="gradient-primary h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Time Display and Controls */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(videoDuration)}
          </span>
          <button
            onClick={togglePlay}
            className="cursor-pointer px-4 py-2 bg-[#3B82F6] text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {isPlaying ? "Pause" : "Lecture"}
          </button>
        </div>
      </div>
    </div>
  );
}


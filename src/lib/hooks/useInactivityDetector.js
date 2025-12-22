"use client";

import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Hook to detect user inactivity
 * @param {number} inactivityTimeout - Time in milliseconds before logout (default: 15 minutes = 900000ms)
 * @param {number} warningTime - Time in milliseconds before logout to show warning (default: 30 seconds = 30000ms)
 * @returns {{ isActive: boolean, timeUntilLogout: number, resetTimer: function }}
 */
export function useInactivityDetector(inactivityTimeout = 900000, warningTime = 30000) {
  const [isActive, setIsActive] = useState(true);
  const [timeUntilLogout, setTimeUntilLogout] = useState(null);
  const lastActivityRef = useRef(Date.now());
  const warningTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const checkIntervalRef = useRef(null);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    setIsActive(true);
    setTimeUntilLogout(null);

    // Clear existing timeouts
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Set new warning timeout (at inactivityTimeout - warningTime)
    const warningDelay = inactivityTimeout - warningTime;
    warningTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
      setTimeUntilLogout(warningTime);

      // Set logout timeout after warning period
      logoutTimeoutRef.current = setTimeout(() => {
        setTimeUntilLogout(0);
      }, warningTime);
    }, warningDelay);
  }, [inactivityTimeout, warningTime]);

  useEffect(() => {
    // Events to track for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners with passive option for better performance
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true, capture: true });
    });

    // Initialize the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, { capture: true });
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, [inactivityTimeout, warningTime, resetTimer]);

  // Update countdown every second when warning is active
  useEffect(() => {
    if (timeUntilLogout === null || timeUntilLogout <= 0 || isActive) {
      return;
    }

    checkIntervalRef.current = setInterval(() => {
      setTimeUntilLogout((prev) => {
        if (prev === null || prev <= 0) return 0;
        return Math.max(0, prev - 1000);
      });
    }, 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [timeUntilLogout, isActive]);

  return {
    isActive,
    timeUntilLogout,
    resetTimer,
  };
}


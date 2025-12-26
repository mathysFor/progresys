// Quiz timer utilities

/**
 * Calculate time remaining in seconds
 * @param {Date|Timestamp} startedAt - When the quiz started
 * @param {number} durationSeconds - Total duration in seconds (default: 1800 = 30 minutes)
 * @returns {number} Time remaining in seconds (0 if expired)
 */
export function calculateTimeRemaining(startedAt, durationSeconds = 1800) {
  if (!startedAt) return durationSeconds;
  
  const startTime = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
  const now = new Date();
  const elapsed = Math.floor((now - startTime) / 1000);
  const remaining = Math.max(0, durationSeconds - elapsed);
  
  return remaining;
}

/**
 * Format seconds to MM:SS format
 * @param {number} seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Check if time has expired
 * @param {Date|Timestamp} startedAt - When the quiz started
 * @param {number} durationSeconds - Total duration in seconds
 * @returns {boolean} True if time has expired
 */
export function isTimeExpired(startedAt, durationSeconds = 1800) {
  return calculateTimeRemaining(startedAt, durationSeconds) === 0;
}

/**
 * Calculate time spent in seconds
 * @param {Date|Timestamp} startedAt - When the quiz started
 * @param {Date|Timestamp} completedAt - When the quiz was completed (optional)
 * @returns {number} Time spent in seconds
 */
export function calculateTimeSpent(startedAt, completedAt = null) {
  if (!startedAt) return 0;
  
  const startTime = startedAt.toDate ? startedAt.toDate() : new Date(startedAt);
  const endTime = completedAt
    ? (completedAt.toDate ? completedAt.toDate() : new Date(completedAt))
    : new Date();
  
  return Math.floor((endTime - startTime) / 1000);
}


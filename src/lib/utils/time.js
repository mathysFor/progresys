/**
 * Format seconds to HH:MM:SS string
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string (always HH:MM:SS)
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) {
    return "00:00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format seconds to human readable string (e.g., "2h 30min" or "45min")
 * @param {number} seconds - Total seconds
 * @returns {string} Human readable time string
 */
export function formatTimeReadable(seconds) {
  if (!seconds || seconds < 0) {
    return "0min";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }

  return parts.length > 0 ? parts.join(" ") : "0min";
}

/**
 * Format seconds to human readable string with seconds (e.g., "2h 30min 45s" or "45min 30s")
 * @param {number} seconds - Total seconds
 * @returns {string} Human readable time string with seconds
 */
export function formatTimeReadableWithSeconds(seconds) {
  if (!seconds || seconds < 0) {
    return "0s";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}


/**
 * Format seconds to HH:MM:SS string
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string (HH:MM:SS or MM:SS if < 1 hour)
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) {
    return "00:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  
  if (hours > 0) {
    parts.push(String(hours).padStart(2, "0"));
  }
  
  parts.push(String(minutes).padStart(2, "0"));
  parts.push(String(secs).padStart(2, "0"));

  return parts.join(":");
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


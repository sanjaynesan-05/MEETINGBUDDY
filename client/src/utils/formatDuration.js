/**
 * Format a duration in seconds into a human-readable string (e.g., "1h 30m" or "45m")
 * @param {number} seconds - The duration in seconds
 * @returns {string} Formatted duration string
 */
export function formatDuration(seconds) {
  if (!seconds) return '0m';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

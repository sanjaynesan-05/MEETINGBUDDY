/**
 * Format a date string into a relative or formatted date
 * @param {string|Date} dateStr - The date to format
 * @param {boolean} relative - Whether to use relative formatting if recent
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr, options = {}) {
  const { relative = true, includeTime = false } = options;
  const now = new Date();
  const date = new Date(dateStr);
  
  if (relative) {
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: includeTime ? 'long' : 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() || includeTime ? 'numeric' : undefined,
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  });
}

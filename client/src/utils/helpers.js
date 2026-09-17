/**
 * Shared client-side utilities
 */

/**
 * Format a date string or Date object for display.
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} options
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
};

/**
 * Format a datetime string for display (includes time).
 */
export const formatDateTime = (date) =>
  formatDate(date, { hour: '2-digit', minute: '2-digit' });

/**
 * Truncate text to a maximum length with an ellipsis.
 */
export const truncate = (text, max = 60) => {
  if (!text || text.length <= max) return text;
  return `${text.slice(0, max)}…`;
};

/**
 * Capitalise the first letter of a string.
 */
export const capitalise = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

/**
 * Return initials from a full name (up to 2 letters).
 */
export const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');

import { parseApiDateTime } from './formatRelativeTime';

/**
 * Relative label from a Date or ISO string (fallback when API sends raw datetime).
 */
export function formatRelativeTimeAgo(value) {
  if (value == null || value === '') return '-';
  let then = value instanceof Date ? value : parseApiDateTime(value);
  if (!then || Number.isNaN(then.getTime())) {
    then = new Date(value);
  }
  if (Number.isNaN(then.getTime())) return String(value);

  let seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 0) seconds = 0;

  if (seconds < 60) {
    return seconds <= 1 ? 'just now' : `${seconds} seconds ago`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Use backend relative text when provided; otherwise format ISO/datetime strings.
 */
export function formatRequestCreatedAtLabel(value) {
  const str = (value ?? '').toString().trim();
  if (!str) return '-';

  const parsed = parseApiDateTime(str);
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return formatRelativeTimeAgo(parsed);
  }

  const fuzzy = new Date(str);
  if (!Number.isNaN(fuzzy.getTime()) && (str.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(str))) {
    return formatRelativeTimeAgo(fuzzy);
  }

  return str;
}

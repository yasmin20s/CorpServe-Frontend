/**
 * Parse API datetimes. ASP.NET often serializes UTC `DateTime` without `Z`; browsers then
 * treat ISO strings as *local* wall time, skewing relative labels by the timezone offset (e.g. +2h in Egypt).
 * If the string looks like ISO with `T` but has no zone, interpret as UTC.
 * @param {string | number | Date | null | undefined} value
 * @returns {Date | null}
 */
export function parseApiDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const s = String(value).trim();
  if (!s) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const trimmed = s.replace(/(\.\d{3})\d+/, '$1');
    const withUtc = trimmed.endsWith('Z') ? trimmed : `${trimmed}Z`;
    const d = new Date(withUtc);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string | number | Date} isoOrDate
 * @param {number} [nowMs]
 * @returns {string}
 */
export function formatRelativeTime(isoOrDate, nowMs = Date.now()) {
  const d = isoOrDate instanceof Date ? isoOrDate : parseApiDateTime(isoOrDate);
  if (!d || Number.isNaN(d.getTime())) return '';

  const diffSec = Math.floor((nowMs - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  const now = new Date(nowMs);
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * @param {string | number | Date} isoOrDate
 * @returns {'Today' | 'Yesterday' | 'Older'}
 */
export function getNotificationPeriodBucket(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : parseApiDateTime(isoOrDate);
  if (!d || Number.isNaN(d.getTime())) return 'Older';

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).getTime();
  const startOfThat = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate()
  ).getTime();
  const diffDays = Math.round((startOfToday - startOfThat) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return 'Older';
}

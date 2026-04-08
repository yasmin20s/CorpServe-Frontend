/**
 * @param {string | number | Date} isoOrDate
 * @param {number} [nowMs]
 * @returns {string}
 */
export function formatRelativeTime(isoOrDate, nowMs = Date.now()) {
  const d =
    isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
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
  const d =
    isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
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

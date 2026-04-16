const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');

/**
 * Returns an absolute URL for profile images / uploads returned by the API.
 */
export function resolveMediaUrl(url) {
  if (url == null || String(url).trim() === '') return '';
  const s = String(url).trim();
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('/')) return `${API_BASE}${s}`;
  return `${API_BASE}/${s}`;
}

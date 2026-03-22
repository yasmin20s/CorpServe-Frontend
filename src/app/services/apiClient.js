const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');
let inMemoryAccessToken = '';
let refreshRequestPromise = null;

function buildHeaders(token, extraHeaders = {}) {
  const headers = {
    ...extraHeaders,
  };

  const authToken = inMemoryAccessToken || token;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

export function setAccessToken(token) {
  inMemoryAccessToken = typeof token === 'string' ? token : '';
}

export function clearAccessToken() {
  inMemoryAccessToken = '';
}

function notifySessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('corpserve:session-expired'));
  }
}

function shouldTryTokenRefresh(path) {
  const normalizedPath = String(path || '').toLowerCase();
  return !(
    normalizedPath.includes('/api/authentication/login') ||
    normalizedPath.includes('/api/authentication/register') ||
    normalizedPath.includes('/api/authentication/refresh-token') ||
    normalizedPath.includes('/api/authentication/revoke-refresh-token') ||
    normalizedPath.includes('/api/authentication/forgot-password') ||
    normalizedPath.includes('/api/authentication/reset-password')
  );
}

function readTokenFromPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const value = payload.token ?? payload.Token;
  return typeof value === 'string' ? value : '';
}

async function refreshAccessToken() {
  if (refreshRequestPromise) {
    return refreshRequestPromise;
  }

  refreshRequestPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/Authentication/refresh-token`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      clearAccessToken();
      return false;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('json');
    const payload = isJson ? await response.json() : null;
    const token = readTokenFromPayload(payload);

    if (!token) {
      clearAccessToken();
      return false;
    }

    setAccessToken(token);
    return true;
  })();

  try {
    return await refreshRequestPromise;
  } finally {
    refreshRequestPromise = null;
  }
}

function normalizeProblemDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const extractedValidationMessage = extractValidationMessage(payload.errors);
  if (extractedValidationMessage) {
    return extractedValidationMessage;
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }

  return null;
}

function extractValidationMessage(errors) {
  if (!errors) return null;

  // Shape A: { fieldName: ["msg1", "msg2"], ... }
  if (!Array.isArray(errors) && typeof errors === 'object') {
    const messages = [];
    for (const [field, value] of Object.entries(errors)) {
      const items = Array.isArray(value) ? value : [value];
      for (const item of items) {
        if (typeof item === 'string' && item.trim()) {
          messages.push(formatValidationMessage(field, item));
        }
      }
    }
    return messages.length ? messages.join(' | ') : null;
  }

  // Shape B (from backend factory): [{ key: "Field", value: ["msg"] }, ...]
  if (Array.isArray(errors)) {
    const messages = [];
    for (const entry of errors) {
      if (!entry || typeof entry !== 'object') continue;
      const field = typeof entry.key === 'string' ? entry.key : 'field';
      const values = Array.isArray(entry.value) ? entry.value : [];
      for (const item of values) {
        if (typeof item === 'string' && item.trim()) {
          messages.push(formatValidationMessage(field, item));
        }
      }
    }
    return messages.length ? messages.join(' | ') : null;
  }

  return null;
}

function formatValidationMessage(field, message) {
  if (!field || field === '$' || field.toLowerCase() === 'request') {
    return message;
  }
  return `${field}: ${message}`;
}

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export async function request(path, options = {}) {
  const { token, headers: extraHeaders, __retryAfterRefresh = false, ...rest } = options;
  const isGetRequest = !rest.method || String(rest.method).toUpperCase() === 'GET';
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    cache: rest.cache ?? (isGetRequest ? 'no-store' : undefined),
    credentials: rest.credentials ?? 'include',
    headers: buildHeaders(token, extraHeaders),
  });

  if (response.status === 401 && !__retryAfterRefresh && shouldTryTokenRefresh(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request(path, {
        ...options,
        token: undefined,
        __retryAfterRefresh: true,
      });
    }
    notifySessionExpired();
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = normalizeProblemDetails(payload) || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) {
    return null;
  }

  return payload;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

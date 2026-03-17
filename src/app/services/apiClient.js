const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7170').replace(/\/+$/, '');

function buildHeaders(token, extraHeaders = {}) {
  const headers = {
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function normalizeProblemDetails(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const firstError = Object.values(payload.errors).flat()[0];
    if (typeof firstError === 'string' && firstError.trim()) {
      return firstError;
    }
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail;
  }

  if (typeof payload.title === 'string' && payload.title.trim()) {
    return payload.title;
  }

  return null;
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
  const { token, headers: extraHeaders, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(token, extraHeaders),
  });

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

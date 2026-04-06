import { request } from './apiClient';

export function generateRequestEstimateApi({ title, description, categoryId, expectedDeadline, budgetMin, budgetMax, token }) {
  return request('/api/Requests/generate-estimate', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      description,
      categoryId,
      expectedDeadline,
      budgetMin,
      budgetMax,
    }),
  });
}

export function createRequestApi({
  title,
  description,
  categoryId,
  expectedDeadline,
  budgetMin,
  budgetMax,
  estimatedCost,
  estimatedTime,
  confidence,
  attachments,
  token,
}) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('categoryId', categoryId);
  formData.append('expectedDeadline', expectedDeadline);
  formData.append('budgetMin', String(budgetMin));
  formData.append('budgetMax', String(budgetMax));

  if (estimatedCost != null && estimatedTime && confidence != null) {
    formData.append('estimatedCost', String(estimatedCost));
    formData.append('estimatedTime', estimatedTime);
    formData.append('confidence', String(confidence));
  }

  (attachments || []).forEach((file) => formData.append('attachments', file));

  return request('/api/Requests/create', {
    method: 'POST',
    token,
    body: formData,
  });
}

export function getMyRequestsApi({
  token,
  search = '',
  requestStatus,
  categoryId = '',
  pageIndex = 1,
  pageSize = 5,
  sortByCategory = false,
  sortDescending = true,
}) {
  const query = new URLSearchParams();
  if (search.trim()) query.set('search', search.trim());
  if (requestStatus != null) query.set('requestStatus', String(requestStatus));
  if (categoryId) query.set('categoryId', categoryId);
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));
  query.set('sortByCategory', String(Boolean(sortByCategory)));
  query.set('sortDescending', String(Boolean(sortDescending)));

  return request(`/api/Requests/my-requests?${query.toString()}`, {
    method: 'GET',
    token,
  });
}

export function updateRequestApi({
  requestId,
  title,
  description,
  categoryId,
  expectedDeadline,
  budgetMin,
  budgetMax,
  attachments,
  token,
}) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('categoryId', categoryId);
  formData.append('expectedDeadline', expectedDeadline);
  formData.append('budgetMin', String(budgetMin));
  formData.append('budgetMax', String(budgetMax));
  (attachments || []).forEach((file) => formData.append('attachments', file));

  const jsonPayload = {
    title,
    description,
    categoryId,
    expectedDeadline,
    budgetMin,
    budgetMax,
  };

  const attempts = [
    { path: `/api/Requests/${requestId}`, method: 'PUT', body: formData },
    { path: `/api/Requests/update/${requestId}`, method: 'PUT', body: formData },
    { path: `/api/Requests/update-request/${requestId}`, method: 'PUT', body: formData },
    {
      path: `/api/Requests/${requestId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonPayload),
    },
    {
      path: `/api/Requests/update/${requestId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonPayload),
    },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return request(attempt.path, {
        method: attempt.method,
        token,
        headers: attempt.headers,
        body: attempt.body,
      });
    } catch (error) {
      lastError = error;
      const retryableStatuses = [404, 405, 415];
      if (!retryableStatuses.includes(error?.status)) {
        throw error;
      }
    }
  }

  throw lastError;
}

export function deleteRequestApi({ requestId, token }) {
  const attempts = [
    { path: `/api/Requests/${requestId}`, method: 'DELETE' },
    { path: `/api/Requests/delete/${requestId}`, method: 'DELETE' },
    { path: `/api/Requests/remove/${requestId}`, method: 'DELETE' },
    { path: `/api/Requests/delete/${requestId}`, method: 'POST' },
  ];

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return request(attempt.path, {
        method: attempt.method,
        token,
      });
    } catch (error) {
      lastError = error;
      const retryableStatuses = [404, 405];
      if (!retryableStatuses.includes(error?.status)) {
        throw error;
      }
    }
  }

  throw lastError;
}

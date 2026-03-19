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

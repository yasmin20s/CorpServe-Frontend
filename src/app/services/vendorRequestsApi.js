import { request } from './apiClient';

export function getVendorRequestsApi({
  token,
  search = '',
  requestStatus,
  categoryId = '',
  pageIndex = 1,
  pageSize = 10,
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

  return request(`/api/Requests/vendor-requests?${query.toString()}`, { method: 'GET', token });
}

export function updateRequestProgressApi({ requestId, percentage, description, token }) {
  return request(`/api/Requests/${requestId}/progress`, {
    method: 'PUT',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ percentage, description }),
  });
}

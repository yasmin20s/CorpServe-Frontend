import { request } from './apiClient';

export function getMyNotificationsApi({ token, search, pageIndex = 1, pageSize = 10, isRead }) {
  const query = new URLSearchParams();
  if (search?.trim()) query.set('search', search.trim());
  if (isRead != null) query.set('isRead', String(isRead));
  query.set('pageIndex', String(pageIndex));
  query.set('pageSize', String(pageSize));

  return request(`/api/Notifications/my?${query.toString()}`, { method: 'GET', token });
}

export function getUnreadNotificationCountApi({ token }) {
  return request('/api/Notifications/unread-count', { method: 'GET', token });
}

export function markNotificationReadApi({ notificationId, token }) {
  return request(`/api/Notifications/${notificationId}/read`, { method: 'POST', token });
}

export function markAllNotificationsReadApi({ token }) {
  return request('/api/Notifications/read-all', { method: 'POST', token });
}

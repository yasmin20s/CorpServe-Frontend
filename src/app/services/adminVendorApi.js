import { request } from './apiClient';

export function getPendingVendorVerificationsApi(token) {
  return request('/api/AdminVendor/pending', {
    method: 'GET',
    token,
  });
}

export function approveVendorVerificationApi({ id, token }) {
  return request(`/api/AdminVendor/approve/${id}`, {
    method: 'POST',
    token,
  });
}

export function rejectVendorVerificationApi({ id, rejectReason, token }) {
  return request(`/api/AdminVendor/reject/${id}`, {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rejectReason }),
  });
}

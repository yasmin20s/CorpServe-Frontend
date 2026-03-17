import { request } from './apiClient';

export function submitVendorVerificationApi({ organizationName, documents, token }) {
  const formData = new FormData();
  formData.append('organizationName', organizationName);
  documents.forEach((file) => formData.append('documents', file));

  return request('/api/VendorVerify/submit', {
    method: 'POST',
    token,
    body: formData,
  });
}

export function getVendorVerificationStatusApi(token) {
  return request('/api/VendorVerify/status', {
    method: 'GET',
    token,
  });
}

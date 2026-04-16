import { request } from './apiClient';

export function getCurrentUserProfileApi(token) {
  return request('/api/UserProfile/me', {
    method: 'GET',
    token,
  });
}

export function getMyDetailedProfileApi(token) {
  return request('/api/UserProfile/me/details', {
    method: 'GET',
    token,
  });
}

export function getUserProfileByIdApi({ userId, token }) {
  const id = encodeURIComponent(userId);
  return request(`/api/UserProfile/${id}`, {
    method: 'GET',
    token,
  });
}

/**
 * @param {object} params
 * @param {string} [params.companyName]
 * @param {string} [params.companyLocation]
 * @param {string} [params.description]
 * @param {File|null} [params.profilePicture]
 * @param {File[]} [params.documentFiles]
 * @param {string} token
 */
export function upsertUserProfileApi({ companyName, companyLocation, description, profilePicture, documentFiles, token }) {
  const formData = new FormData();
  if (companyName != null) formData.append('companyName', companyName);
  if (companyLocation != null) formData.append('companyLocation', companyLocation);
  if (description != null) formData.append('description', description);
  if (profilePicture instanceof File) formData.append('profilePicture', profilePicture);
  (documentFiles || []).forEach((f) => {
    if (f instanceof File) formData.append('documentFiles', f);
  });
  return request('/api/UserProfile/profile', {
    method: 'POST',
    token,
    body: formData,
  });
}

export function updateCurrentUserApi({ fullName, email, phoneNumber, token }) {
  return request('/api/UserProfile/update-user', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fullName,
      email,
      phoneNumber,
    }),
  });
}

export function changeCurrentUserPasswordApi({ currentPassword, newPassword, confirmNewPassword, token }) {
  return request('/api/UserProfile/change-password', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmNewPassword,
    }),
  });
}

export function getUserPreferencesApi(token) {
  return request('/api/UserProfile/user-preference', {
    method: 'GET',
    token,
  });
}

export function updateUserPreferencesApi({ emailNotification, systemNotification, token }) {
  return request('/api/UserProfile/update-user-preference', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emailNotification,
      systemNotification,
    }),
  });
}

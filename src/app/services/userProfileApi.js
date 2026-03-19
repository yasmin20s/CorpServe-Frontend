import { request } from './apiClient';

export function getCurrentUserProfileApi(token) {
  return request('/api/UserProfile/me', {
    method: 'GET',
    token,
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

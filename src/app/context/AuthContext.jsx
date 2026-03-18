import { createContext, useMemo, useState } from 'react';
import { forgotPasswordApi, loginApi, registerApi, resetPasswordApi } from '../services/authApi';
import { ApiError } from '../services/apiClient';
import { getVendorVerificationStatusApi } from '../services/vendorVerifyApi';

const AUTH_STORAGE_KEY = 'corpserve-auth';

const initialUserState = {
  fullName: '',
  email: '',
  role: 'client',
  token: '',
  isAuthenticated: false,
};

function toClientRole(role) {
  return (role || '').toLowerCase();
}

function getAuthField(payload, camelKey, pascalKey) {
  if (!payload || typeof payload !== 'object') return '';
  const value = payload[camelKey] ?? payload[pascalKey];
  return typeof value === 'string' ? value : '';
}

function normalizeLoginResponse(authResponse, fallbackEmail) {
  const fullName = getAuthField(authResponse, 'fullName', 'FullName');
  const email = getAuthField(authResponse, 'email', 'Email') || fallbackEmail;
  const role = getAuthField(authResponse, 'role', 'Role');
  const token = getAuthField(authResponse, 'token', 'Token');

  return { fullName, email, role, token };
}

function redirectPathForRole(role) {
  switch (toClientRole(role)) {
    case 'admin':
      return '/admin/dashboard';
    case 'vendor':
      return '/vendor/dashboard';
    case 'client':
    default:
      return '/client/dashboard';
  }
}

function parseVerificationStatus(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'pending') return 1;
    if (normalized === 'approved') return 2;
    if (normalized === 'rejected') return 3;
    const numeric = Number.parseInt(raw, 10);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return initialUserState;

    const parsed = JSON.parse(raw);
    if (!parsed?.token) return initialUserState;

    return {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      role: toClientRole(parsed.role) || 'client',
      token: parsed.token,
      isAuthenticated: true,
    };
  } catch {
    return initialUserState;
  }
}

function persistAuth(user) {
  if (!user?.token) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: user.token,
    }),
  );
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredAuth());

  const updateAuthenticatedUser = (updates) => {
    setUser((prevUser) => {
      if (!prevUser?.isAuthenticated || !prevUser?.token) {
        return prevUser;
      }

      const nextUser = {
        ...prevUser,
        ...(typeof updates === 'object' && updates ? updates : {}),
      };

      persistAuth(nextUser);
      return nextUser;
    });
  };

  const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const authResponse = await loginApi({
        email: normalizedEmail,
        password,
      });
      const normalized = normalizeLoginResponse(authResponse, normalizedEmail);
      if (!normalized.token) {
        return { success: false, message: 'Login response is missing token. Please contact support.' };
      }

      const nextUser = {
        fullName: normalized.fullName,
        email: normalized.email,
        role: toClientRole(normalized.role) || 'client',
        token: normalized.token,
        isAuthenticated: true,
      };

      setUser(nextUser);
      persistAuth(nextUser);

      let redirectTo = redirectPathForRole(normalized.role);
      if (toClientRole(normalized.role) === 'vendor' && nextUser.token) {
        try {
          const verificationStatus = await getVendorVerificationStatusApi(nextUser.token);
          const statusCode = parseVerificationStatus(verificationStatus?.status);
          if (statusCode === 1 || statusCode === 3) {
            redirectTo = '/vendor-verification';
          }
        } catch (statusError) {
          if (statusError?.status !== 404) {
            console.warn('Vendor verification status check failed.', statusError);
          }
        }
      }

      return {
        success: true,
        message: `Login successful! Welcome ${normalized.fullName || ''}`.trim(),
        redirectTo,
      };
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Login failed. Please try again.';
      return { success: false, message };
    }
  };

  const signup = async ({ fullName, email, phone, password, confirmPassword, role, categoryIds }) => {
    try {
      const authResponse = await registerApi({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        role,
        categoryIds,
      });

      const normalizedRole = toClientRole(authResponse.role || role);
      const nextUser = {
        fullName: authResponse.fullName || fullName.trim(),
        email: authResponse.email || email.trim(),
        role: normalizedRole || 'client',
        token: authResponse.token || '',
        isAuthenticated: !!authResponse.token,
      };

      if (nextUser.isAuthenticated) {
        setUser(nextUser);
        persistAuth(nextUser);
      }

      return {
        success: true,
        message:
          normalizedRole === 'vendor'
            ? 'Account created successfully. Continue with vendor verification.'
            : 'Account created successfully. Please login to continue.',
        redirectTo: normalizedRole === 'vendor' ? '/vendor-verification' : '/login',
      };
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Signup failed. Please try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(initialUserState);
    persistAuth(null);
  };

  const requestPasswordReset = async (email) => {
    try {
      await forgotPasswordApi({ email: email.trim() });
      return { success: true, message: 'Password reset link sent successfully.' };
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not send reset instructions. Please try again.';
      return { success: false, message };
    }
  };

  const resetPassword = async ({ email, token, password, confirmPassword }) => {
    try {
      await resetPasswordApi({
        email: email.trim(),
        token,
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });
      return {
        success: true,
        message: 'Password reset successful. Please log in with your new password.',
      };
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Could not reset password. Please try again.';
      return { success: false, message };
    }
  };

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
      updateAuthenticatedUser,
      requestPasswordReset,
      resetPassword,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

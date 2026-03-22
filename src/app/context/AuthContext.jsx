import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  forgotPasswordApi,
  loginApi,
  refreshTokenApi,
  registerApi,
  resetPasswordApi,
  revokeRefreshTokenApi,
} from '../services/authApi';
import { ApiError, clearAccessToken, setAccessToken } from '../services/apiClient';
import { getVendorVerificationStatusApi } from '../services/vendorVerifyApi';

const AUTH_STORAGE_KEY = 'corpserve-auth-profile';

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

function normalizeAuthResponse(authResponse, fallbackEmail) {
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

function readStoredAuthProfile() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      fullName: parsed.fullName || '',
      email: parsed.email || '',
      role: toClientRole(parsed.role) || 'client',
    };
  } catch {
    return null;
  }
}

function persistAuthProfile(user) {
  if (!user?.isAuthenticated) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    }),
  );
}

function buildAuthenticatedUser(authResponse, fallbackEmail = '', fallbackRole = 'client', fallbackName = '') {
  const normalized = normalizeAuthResponse(authResponse, fallbackEmail);
  if (!normalized.token) {
    return null;
  }

  return {
    fullName: normalized.fullName || fallbackName,
    email: normalized.email || fallbackEmail,
    role: toClientRole(normalized.role) || toClientRole(fallbackRole) || 'client',
    token: normalized.token,
    isAuthenticated: true,
  };
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUserState);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearAuthState = useCallback(() => {
    clearAccessToken();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(initialUserState);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      const storedProfile = readStoredAuthProfile();
      if (!storedProfile) {
        if (isMounted) {
          setIsBootstrapping(false);
        }
        return;
      }

      try {
        const authResponse = await refreshTokenApi();
        const nextUser = buildAuthenticatedUser(
          authResponse,
          storedProfile.email,
          storedProfile.role,
          storedProfile.fullName,
        );

        if (!nextUser) {
          if (isMounted) {
            clearAuthState();
          }
          return;
        }

        setAccessToken(nextUser.token);
        if (isMounted) {
          setUser(nextUser);
          persistAuthProfile(nextUser);
        }
      } catch {
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuthState]);

  useEffect(() => {
    function handleSessionExpired() {
      clearAuthState();
    }

    window.addEventListener('corpserve:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('corpserve:session-expired', handleSessionExpired);
    };
  }, [clearAuthState]);

  const updateAuthenticatedUser = (updates) => {
    setUser((prevUser) => {
      if (!prevUser?.isAuthenticated || !prevUser?.token) {
        return prevUser;
      }

      const nextUser = {
        ...prevUser,
        ...(typeof updates === 'object' && updates ? updates : {}),
      };

      persistAuthProfile(nextUser);
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
      const nextUser = buildAuthenticatedUser(authResponse, normalizedEmail);
      if (!nextUser) {
        return { success: false, message: 'Login response is missing token. Please contact support.' };
      }

      setAccessToken(nextUser.token);
      setUser(nextUser);
      persistAuthProfile(nextUser);

      let redirectTo = redirectPathForRole(nextUser.role);
      if (toClientRole(nextUser.role) === 'vendor' && nextUser.token) {
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
        message: `Login successful! Welcome ${nextUser.fullName || ''}`.trim(),
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
      const nextUser = buildAuthenticatedUser(
        authResponse,
        email.trim(),
        normalizedRole || 'client',
        fullName.trim(),
      );

      if (nextUser?.isAuthenticated) {
        setAccessToken(nextUser.token);
        setUser(nextUser);
        persistAuthProfile(nextUser);
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

  const logout = async () => {
    try {
      await revokeRefreshTokenApi();
    } catch {
      // Always clear local auth state even if revoke fails.
    }
    clearAuthState();
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
      isBootstrapping,
      login,
      signup,
      logout,
      updateAuthenticatedUser,
      requestPasswordReset,
      resetPassword,
    }),
    [isBootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

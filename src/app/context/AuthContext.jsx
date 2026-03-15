import { createContext, useMemo, useState } from 'react';

const initialUserState = {
  role: 'client',
  isAuthenticated: false,
  isVendorApproved: false,
};

const DEMO_USERS = {
  'client@demo.com': { password: 'demo123', role: 'client', welcome: 'Client' },
  'vendor@demo.com': { password: 'demo123', role: 'vendor', welcome: 'Vendor' },
  'admin@demo.com': { password: 'demo123', role: 'admin', welcome: 'Admin' },
};

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function createResetToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUserState);
  const [demoUsers, setDemoUsers] = useState(DEMO_USERS);
  const [resetTokens, setResetTokens] = useState({});

  const login = ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();
    const demoUser = demoUsers[normalizedEmail];

    if (!demoUser || demoUser.password !== password) {
      return {
        success: false,
        message: 'Invalid credentials. Please use demo credentials.',
      };
    }

    setUser({
      role: demoUser.role,
      isAuthenticated: true,
      isVendorApproved: true,
    });

    return {
      success: true,
      message: `Login successful! Welcome ${demoUser.welcome}`,
      redirectTo: `/${demoUser.role}/dashboard`,
    };
  };

  const signup = ({ role }) => {
    if (role === 'client') {
      setUser({
        role: 'client',
        isAuthenticated: true,
        isVendorApproved: true,
      });

      return {
        success: true,
        message: 'Account created successfully!',
        redirectTo: '/client/dashboard',
      };
    }

    setUser({
      role: 'vendor',
      isAuthenticated: false,
      isVendorApproved: false,
    });

    return {
      success: true,
      message: 'Account created successfully!',
      redirectTo: '/vendor-verification',
    };
  };

  const logout = () => {
    setUser(initialUserState);
  };

  const requestPasswordReset = (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = demoUsers[normalizedEmail];

    // Keep the response generic for unknown accounts.
    if (!existingUser) {
      return {
        success: true,
        message: 'If this email exists, a reset link has been sent.',
      };
    }

    const token = createResetToken();
    const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

    setResetTokens((prev) => ({
      ...prev,
      [token]: {
        email: normalizedEmail,
        expiresAt,
        used: false,
      },
    }));

    return {
      success: true,
      message: 'Reset link generated successfully.',
      token,
      resetUrl: `/reset-password?token=${encodeURIComponent(token)}`,
    };
  };

  const validateResetToken = (token) => {
    if (!token) {
      return { valid: false, message: 'Reset token is missing.' };
    }

    const entry = resetTokens[token];

    if (!entry) {
      return { valid: false, message: 'Invalid reset token.' };
    }

    if (entry.used) {
      return { valid: false, message: 'This reset link has already been used.' };
    }

    if (Date.now() > entry.expiresAt) {
      return { valid: false, message: 'This reset link has expired.' };
    }

    return { valid: true, email: entry.email };
  };

  const resetPassword = ({ token, password }) => {
    const tokenValidation = validateResetToken(token);
    if (!tokenValidation.valid) {
      return {
        success: false,
        message: tokenValidation.message,
      };
    }

    const email = tokenValidation.email;

    setDemoUsers((prev) => ({
      ...prev,
      [email]: {
        ...prev[email],
        password,
      },
    }));

    setResetTokens((prev) => ({
      ...prev,
      [token]: {
        ...prev[token],
        used: true,
      },
    }));

    return {
      success: true,
      message: 'Password reset successful. Please log in with your new password.',
    };
  };

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
      requestPasswordReset,
      validateResetToken,
      resetPassword,
    }),
    [demoUsers, resetTokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

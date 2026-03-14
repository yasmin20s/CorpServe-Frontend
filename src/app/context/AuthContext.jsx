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

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initialUserState);

  const login = ({ email, password }) => {
    const normalizedEmail = email.toLowerCase();
    const demoUser = DEMO_USERS[normalizedEmail];

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

  const value = useMemo(
    () => ({
      user,
      login,
      signup,
      logout,
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

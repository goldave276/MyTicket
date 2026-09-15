import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Lazy initializer: read the last known user from storage synchronously so the
  // first render already reflects it, instead of setting it from inside an effect.
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('myticket_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await authService.getProfile();
      setUser(userData);
    } catch {
      // Token invalid or session expired
      setUser(null);
      localStorage.removeItem('myticket_token');
      localStorage.removeItem('myticket_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Confirm (or invalidate) the stored user against the backend on mount.
    // Deferred to a microtask so the effect doesn't call setState
    // synchronously (refreshUser sets `loading` before its first `await`).
    queueMicrotask(() => refreshUser());
  }, [refreshUser]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.user) {
        setUser(res.user);
      } else {
        await refreshUser();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data) => {
    setLoading(true);
    try {
      const res = await authService.signup(data);
      if (res.user) {
        setUser(res.user);
      } else {
        await refreshUser();
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    if (res.user) {
      setUser(res.user);
    } else {
      await refreshUser();
    }
    return res;
  };

  const userRole = user?.role || 'USER';
  const isOrganizer = userRole === 'ORGANIZER' || userRole === 'ADMIN';
  const isAdmin = userRole === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isOrganizer,
        isAdmin,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

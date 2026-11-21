import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';
import { notifyDataUpdated } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  // Lazy initializer: read the last known user from storage synchronously so the
  // first render already reflects it, instead of setting it from inside an effect.
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const lastRefreshRef = useRef(0);
  const lastRoleRef = useRef(user?.role ? String(user.role).trim().toUpperCase() : null);

  useEffect(() => {
    lastRoleRef.current = user?.role ? String(user.role).trim().toUpperCase() : null;
  }, [user]);

  const refreshUser = useCallback(async () => {
    lastRefreshRef.current = Date.now();
    try {
      const storedToken = localStorage.getItem('myticket_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      const prevRole = lastRoleRef.current;
      const userData = await authService.getProfile();
      const nextRole = userData?.role ? String(userData.role).trim().toUpperCase() : null;
      setUser(userData);

      if (prevRole && nextRole && prevRole !== nextRole) {
        window.dispatchEvent(
          new CustomEvent('myticket_role_updated', {
            detail: { prevRole, role: nextRole },
          })
        );
        notifyDataUpdated('auth');
      }
    } catch (err) {
      // The API client clears storage only after a confirmed expired/invalid
      // session. A network or temporary API outage must not sign the user out.
      if (err?.status === 401) {
        setUser(null);
        localStorage.removeItem('myticket_token');
        localStorage.removeItem('myticket_refresh_token');
        localStorage.removeItem('myticket_user');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Confirm (or invalidate) the stored user against the backend on mount.
    // Deferred to a microtask so the effect doesn't call setState
    // synchronously (refreshUser sets `loading` before its first `await`).
    queueMicrotask(() => refreshUser());

    const handleAuthExpired = () => {
      setUser(null);
      setLoading(false);
    };

    // Synchronise automatiquement le profil et le rôle (ex: devenu ORGANIZER) au retour sur l'onglet
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== 'visible') return;
      if (!localStorage.getItem('myticket_token')) return;
      if (Date.now() - lastRefreshRef.current < 15000) return;
      refreshUser();
    };

    window.addEventListener('myticket_auth_expired', handleAuthExpired);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('myticket_auth_expired', handleAuthExpired);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
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
      if (router.pathname !== '/') {
        await router.replace('/');
      }
    } finally {
      setUser(null);
      setLoading(false);
      notifyDataUpdated('auth');
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

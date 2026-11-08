import apiFetch, { clearAuthStorageAndNotify } from './api';

export const authService = {
  async login(credentials) {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store tokens and user
    const token = response.accessToken || response.token || response.session?.access_token;
    const refreshToken = response.refreshToken || response.session?.refresh_token;
    if (token) {
      localStorage.setItem('myticket_token', token);
    }
    if (refreshToken) {
      localStorage.setItem('myticket_refresh_token', refreshToken);
    }
    const userToStore = response.profile
      ? { ...response.user, ...response.profile, role: response.profile.role || response.user?.role || 'USER' }
      : response.user;
    if (userToStore) {
      localStorage.setItem('myticket_user', JSON.stringify(userToStore));
    }
    return { ...response, user: userToStore };
  },

  async signup(data) {
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const token = response.accessToken || response.token || response.session?.access_token;
    const refreshToken = response.refreshToken || response.session?.refresh_token;
    if (token) {
      localStorage.setItem('myticket_token', token);
    }
    if (refreshToken) {
      localStorage.setItem('myticket_refresh_token', refreshToken);
    }
    const userToStore = response.profile
      ? { ...response.user, ...response.profile, role: response.profile.role || response.user?.role || 'USER' }
      : response.user;
    if (userToStore) {
      localStorage.setItem('myticket_user', JSON.stringify(userToStore));
    }
    return { ...response, user: userToStore };
  },

  async refreshSession() {
    if (typeof window === 'undefined') return null;
    const refreshToken = localStorage.getItem('myticket_refresh_token');
    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      if (typeof clearAuthStorageAndNotify === 'function') {
        clearAuthStorageAndNotify();
      } else {
        localStorage.removeItem('myticket_token');
        localStorage.removeItem('myticket_refresh_token');
        localStorage.removeItem('myticket_user');
      }
      throw new Error('Session expirée');
    }

    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem('myticket_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('myticket_refresh_token', data.refreshToken);
    }
    const userToStore = data.profile
      ? { ...data.user, ...data.profile, role: data.profile.role || data.user?.role || 'USER' }
      : data.user;
    if (userToStore) {
      localStorage.setItem('myticket_user', JSON.stringify(userToStore));
    }
    return { ...data, user: userToStore };
  },

  async getProfile() {
    const response = await apiFetch('/auth/me');
    // `/auth/me` separates Supabase auth data (email, id) from the app profile
    // (role, full_name). Persist one complete object for UI restoration.
    const user = response.user
      ? { ...response.user, ...(response.profile || {}) }
      : response;
    if (user) {
      localStorage.setItem('myticket_user', JSON.stringify(user));
    }
    return user;
  },

  async updateProfile(profileData) {
    const response = await apiFetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    const updatedUser = response.profile || response.user;
    if (updatedUser) {
      localStorage.setItem('myticket_user', JSON.stringify(updatedUser));
    }
    return response;
  },

  async requestPasswordReset(email) {
    return apiFetch('/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors if session already expired
    } finally {
      if (typeof clearAuthStorageAndNotify === 'function') {
        clearAuthStorageAndNotify();
      } else {
        localStorage.removeItem('myticket_token');
        localStorage.removeItem('myticket_refresh_token');
        localStorage.removeItem('myticket_user');
      }
    }
  },

  getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem('myticket_token');
      if (!token) {
        if (typeof clearAuthStorageAndNotify === 'function') {
          clearAuthStorageAndNotify();
        } else {
          localStorage.removeItem('myticket_user');
          localStorage.removeItem('myticket_refresh_token');
        }
        return null;
      }
      const stored = localStorage.getItem('myticket_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};

export default authService;

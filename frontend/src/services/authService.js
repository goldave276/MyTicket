import apiFetch from './api';

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
    if (response.user) {
      localStorage.setItem('myticket_user', JSON.stringify(response.user));
    }
    return response;
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
    if (response.user) {
      localStorage.setItem('myticket_user', JSON.stringify(response.user));
    }
    return response;
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
      localStorage.removeItem('myticket_token');
      localStorage.removeItem('myticket_refresh_token');
      localStorage.removeItem('myticket_user');
      throw new Error('Session expirée');
    }

    const data = await response.json();
    if (data.accessToken) {
      localStorage.setItem('myticket_token', data.accessToken);
    }
    if (data.refreshToken) {
      localStorage.setItem('myticket_refresh_token', data.refreshToken);
    }
    if (data.user) {
      localStorage.setItem('myticket_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getProfile() {
    const response = await apiFetch('/auth/me');
    if (response.user) {
      localStorage.setItem('myticket_user', JSON.stringify(response.user));
    }
    return response.user || response;
  },

  async updateProfile(profileData) {
    const response = await apiFetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    if (response.user) {
      localStorage.setItem('myticket_user', JSON.stringify(response.user));
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
      localStorage.removeItem('myticket_token');
      localStorage.removeItem('myticket_refresh_token');
      localStorage.removeItem('myticket_user');
    }
  },

  getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
      const token = localStorage.getItem('myticket_token');
      if (!token) {
        localStorage.removeItem('myticket_user');
        localStorage.removeItem('myticket_refresh_token');
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

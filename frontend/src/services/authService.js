import apiFetch from './api';

export const authService = {
  async login(credentials) {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store token and user
    if (response.token || response.session?.access_token) {
      const token = response.token || response.session?.access_token;
      localStorage.setItem('myticket_token', token);
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
    if (response.token || response.session?.access_token) {
      const token = response.token || response.session?.access_token;
      localStorage.setItem('myticket_token', token);
    }
    if (response.user) {
      localStorage.setItem('myticket_user', JSON.stringify(response.user));
    }
    return response;
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
      localStorage.removeItem('myticket_user');
    }
  },

  getStoredUser() {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('myticket_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};

export default authService;

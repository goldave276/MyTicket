import apiFetch from './api';

export const adminService = {
  async getOrganizerRequests() {
    return apiFetch('/admin/organizer-requests');
  },

  async approveOrganizerRequest(requestId) {
    return apiFetch(`/admin/organizer-requests/${requestId}/approve`, {
      method: 'PATCH',
    });
  },

  async rejectOrganizerRequest(requestId, reason) {
    return apiFetch(`/admin/organizer-requests/${requestId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async getPendingEvents() {
    return apiFetch('/admin/events/pending');
  },

  async approveEvent(eventId) {
    return apiFetch(`/admin/events/${eventId}/approve`, {
      method: 'PATCH',
    });
  },

  async rejectEvent(eventId, reason) {
    return apiFetch(`/admin/events/${eventId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  async getGlobalStats() {
    return apiFetch('/admin/stats');
  },

  async getUsers() {
    return apiFetch('/admin/users');
  },

  async updateUserRole(userId, role) {
    return apiFetch(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async toggleUserBlock(userId, isBlocked) {
    return apiFetch(`/admin/users/${userId}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked }),
    });
  },
};

export default adminService;

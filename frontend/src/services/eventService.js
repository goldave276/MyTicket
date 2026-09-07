import apiFetch from './api';

export const eventService = {
  async getApprovedEvents(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    const endpoint = `/events/approved${queryString ? `?${queryString}` : ''}`;
    return apiFetch(endpoint);
  },

  async getEventDetails(eventId) {
    return apiFetch(`/events/${eventId}`);
  },

  async createDraftEvent(eventData) {
    return apiFetch('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async getMyEvents() {
    return apiFetch('/events/me');
  },

  async getOrganizerStats() {
    return apiFetch('/events/stats');
  },

  async updateEvent(eventId, eventData) {
    return apiFetch(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(eventData),
    });
  },

  async submitEvent(eventId) {
    return apiFetch(`/events/${eventId}/submit`, {
      method: 'PATCH',
    });
  },

  async cancelEvent(eventId) {
    return apiFetch(`/events/${eventId}/cancel`, {
      method: 'PATCH',
    });
  },

  async getEventReservations(eventId) {
    return apiFetch(`/events/${eventId}/reservations`);
  },
};

export default eventService;

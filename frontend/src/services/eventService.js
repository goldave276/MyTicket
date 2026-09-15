import apiFetch from './api';

/**
 * Converts a `datetime-local` input value (no seconds, no timezone, e.g.
 * "2026-10-15T20:00") into the full ISO-8601-with-timezone string the backend
 * requires (see backend/src/validators/eventValidator.js). Accepts an
 * already-ISO value too, so it is safe to call on data coming back from the API.
 */
function toIsoDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/**
 * Maps the event form's field names to the backend contract. The form keeps
 * the friendlier `date` / `totalTickets` names; the API expects `eventDate`
 * (ISO with timezone, must be future) and `capacity`. Centralizing the
 * mapping here means every caller (create, edit) is guaranteed to send a
 * payload the backend actually accepts.
 */
function toEventPayload(formData) {
  return {
    title: formData.title,
    description: formData.description,
    eventType: formData.eventType,
    location: formData.location,
    eventDate: toIsoDateTime(formData.date || formData.eventDate),
    capacity: Number(formData.totalTickets ?? formData.capacity),
    price: Number(formData.price),
  };
}

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
      body: JSON.stringify(toEventPayload(eventData)),
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
      body: JSON.stringify(toEventPayload(eventData)),
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

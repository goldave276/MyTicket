import apiFetch from './api';

export const reservationService = {
  async createReservation({ eventId, quantity }) {
    return apiFetch('/reservations', {
      method: 'POST',
      body: JSON.stringify({ eventId, quantity }),
    });
  },

  async getMyReservations() {
    return apiFetch('/reservations/me');
  },

  async cancelReservation(reservationId) {
    return apiFetch(`/reservations/${reservationId}/cancel`, {
      method: 'PATCH',
    });
  },

  async submitOrganizerRequest(requestData) {
    return apiFetch('/organizer-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  async getMyOrganizerRequests() {
    return apiFetch('/organizer-requests');
  },
};

export default reservationService;

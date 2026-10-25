import apiFetch from './api';

export const ticketService = {
  async getMyTickets() {
    return apiFetch('/tickets/me');
  },

  async scanTicket({ ticketCode, eventId }) {
    return apiFetch('/tickets/scan', {
      method: 'POST',
      body: JSON.stringify({ ticketCode, eventId }),
    });
  },

  async getCheckinSummary(eventId) {
    return apiFetch(`/tickets/events/${eventId}/checkin-summary`);
  },
};

export default ticketService;

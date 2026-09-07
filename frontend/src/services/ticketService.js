import apiFetch from './api';

export const ticketService = {
  async getMyTickets() {
    return apiFetch('/tickets/me');
  },
};

export default ticketService;

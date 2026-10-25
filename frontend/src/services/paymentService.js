import apiFetch from './api';

export const paymentService = {
  async initiateCheckout({ reservationId, paymentMethod, phoneNumber }) {
    return apiFetch('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ reservationId, paymentMethod, phoneNumber }),
    });
  },

  async getMyPayments() {
    return apiFetch('/payments/me');
  },
};

export default paymentService;

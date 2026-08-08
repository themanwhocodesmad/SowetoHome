import type { CheckoutResponse } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const paymentsApi = {
  getCheckoutForm: (bookingId: string) =>
    apiFetch<CheckoutResponse>(`/api/payments/checkout/${bookingId}`, { method: 'POST' }),
};

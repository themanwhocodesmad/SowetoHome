import type { YocoCheckoutResponse } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const paymentsApi = {
  getCheckoutForm: (bookingId: string) =>
    apiFetch<YocoCheckoutResponse>(`/api/payments/checkout/${bookingId}`, { method: 'POST' }),
};

import { apiFetch } from './client.js';

export interface PayfastCheckout {
  actionUrl: string;
  fields: Record<string, string>;
}

export const paymentsApi = {
  getCheckoutForm: (bookingId: string) =>
    apiFetch<PayfastCheckout>(`/api/payments/checkout/${bookingId}`, { method: 'POST' }),
};

// PayFast expects a real HTML form POST (its signature covers exact field encoding),
// not a fetch/XHR request - build one on the fly and submit it.
export function submitPayfastForm(checkout: PayfastCheckout): void {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkout.actionUrl;

  Object.entries(checkout.fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

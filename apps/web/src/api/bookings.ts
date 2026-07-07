import type { BookingDto, CancelBookingInput, CreateBookingInput } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
    apiFetch<BookingDto>('/api/bookings', { method: 'POST', body: JSON.stringify(input) }),
  getById: (id: string) => apiFetch<BookingDto>(`/api/bookings/${id}`),
  listMineAsGuest: () => apiFetch<BookingDto[]>('/api/bookings/mine/guest'),
  listMineAsHost: () => apiFetch<BookingDto[]>('/api/bookings/mine/host'),
  cancel: (id: string, input: CancelBookingInput) =>
    apiFetch<BookingDto>(`/api/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

import type { MarkPayoutPaidInput, PaginatedResult, PayoutDto } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const payoutsApi = {
  listMine: () => apiFetch<PayoutDto[]>('/api/payouts/mine'),
  listForAdmin: (page = 1, limit = 20, status?: string) =>
    apiFetch<PaginatedResult<PayoutDto>>(
      `/api/payouts?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
    ),
  markPaid: (id: string, input: MarkPayoutPaidInput) =>
    apiFetch<PayoutDto>(`/api/payouts/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

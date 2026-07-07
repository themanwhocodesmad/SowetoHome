import type { ReviewDto, SubmitReviewInput } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const reviewsApi = {
  submitProperty: (input: SubmitReviewInput) =>
    apiFetch<ReviewDto>('/api/reviews/property', { method: 'POST', body: JSON.stringify(input) }),
  submitHost: (input: SubmitReviewInput) =>
    apiFetch<ReviewDto>('/api/reviews/host', { method: 'POST', body: JSON.stringify(input) }),
  submitGuest: (input: SubmitReviewInput) =>
    apiFetch<ReviewDto>('/api/reviews/guest', { method: 'POST', body: JSON.stringify(input) }),
  listForProperty: (propertyId: string) =>
    apiFetch<ReviewDto[]>(`/api/reviews/property/${propertyId}`),
  listForHost: (hostId: string) => apiFetch<ReviewDto[]>(`/api/reviews/host/${hostId}`),
};

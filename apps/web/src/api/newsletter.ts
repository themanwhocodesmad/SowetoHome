import type { NewsletterSubscriptionDto, SubscribeNewsletterInput } from '@soweto-stays/shared';
import { apiFetch } from './client.js';

export const newsletterApi = {
  subscribe: (input: SubscribeNewsletterInput) =>
    apiFetch<NewsletterSubscriptionDto>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};

import type { NewsletterSubscriptionDto, SubscribeNewsletterInput } from '@soweto-stays/shared';
import type { NewsletterSubscriberDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { newsletterRepository } from './newsletter.repository.js';

function toDto(subscriber: NewsletterSubscriberDocument): NewsletterSubscriptionDto {
  return {
    id: subscriber._id.toString(),
    email: subscriber.email,
    subscribedAt: subscriber.createdAt.toISOString(),
  };
}

export const newsletterService = {
  async subscribe(input: SubscribeNewsletterInput): Promise<NewsletterSubscriptionDto> {
    const existing = await newsletterRepository.findByEmail(input.email);
    if (existing) throw AppError.conflict('This email is already subscribed');

    const subscriber = await newsletterRepository.create(input.email);
    await enqueueEmail('newsletter-confirmation', { newsletterSubscriberId: subscriber._id.toString() });
    return toDto(subscriber);
  },
};

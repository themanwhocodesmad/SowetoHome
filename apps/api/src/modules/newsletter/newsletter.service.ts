import type { NewsletterSubscriptionDto, SubscribeNewsletterInput } from '@soweto-stays/shared';
import type { NewsletterSubscriberDocument } from '@soweto-stays/db';
import { AppError } from '../../common/errors/AppError.js';
import { logger } from '../../common/logger.js';
import { enqueueEmail } from '../../common/queue/notify.js';
import { newsletterRepository } from './newsletter.repository.js';

// Best-effort: a confirmation email is a nice-to-have, not something the subscribe
// request should ever fail or hang on if the queue/Redis is briefly unavailable.
function enqueueConfirmationEmail(newsletterSubscriberId: string): void {
  void enqueueEmail('newsletter-confirmation', { newsletterSubscriberId }).catch((err) => {
    logger.warn({ err, newsletterSubscriberId }, 'Failed to enqueue newsletter confirmation email');
  });
}

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
    enqueueConfirmationEmail(subscriber._id.toString());
    return toDto(subscriber);
  },
};

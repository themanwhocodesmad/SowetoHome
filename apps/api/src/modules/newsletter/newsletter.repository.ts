import { NewsletterSubscriberModel, type NewsletterSubscriberDocument } from '@soweto-stays/db';

export const newsletterRepository = {
  findByEmail(email: string): Promise<NewsletterSubscriberDocument | null> {
    return NewsletterSubscriberModel.findOne({ email: email.toLowerCase() });
  },

  create(email: string): Promise<NewsletterSubscriberDocument> {
    return NewsletterSubscriberModel.create({ email: email.toLowerCase() });
  },
};

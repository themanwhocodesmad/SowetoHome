import { Schema, model, type HydratedDocument } from 'mongoose';

export interface INewsletterSubscriber {
  email: string;
  createdAt: Date;
}

export type NewsletterSubscriberDocument = HydratedDocument<INewsletterSubscriber>;

const newsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const NewsletterSubscriberModel = model<INewsletterSubscriber>(
  'NewsletterSubscriber',
  newsletterSubscriberSchema,
);

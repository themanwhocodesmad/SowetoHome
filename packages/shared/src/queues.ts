// Shared between apps/api (producer) and apps/worker (consumer) so job names and
// payload shapes can't drift between the two processes.

export const QUEUE_NAMES = {
  EMAIL: 'email',
  BOOKING_REMINDER: 'booking-reminder',
  RATING_PROMPT: 'rating-prompt',
} as const;
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const EMAIL_TEMPLATES = [
  'welcome',
  'booking-requested',
  'booking-confirmed',
  'checkin-reminder',
  'checkout-rating-prompt',
  'cancellation-confirmed',
  'refund-processed',
  'host-payout-sent',
  'admin-new-host',
  'admin-listing-pending',
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

// Deliberately carries IDs, not resolved emails/names: the worker looks up current data
// at send time, so a booking cancelled between enqueue and send doesn't send a stale email,
// and no PII sits in the Redis queue any longer than the job takes to process.
export interface EmailJobPayload {
  template: EmailTemplate;
  context: {
    userId?: string;
    bookingId?: string;
  };
}

export interface BookingReminderJobPayload {
  bookingId: string;
}

export interface RatingPromptJobPayload {
  bookingId: string;
}
